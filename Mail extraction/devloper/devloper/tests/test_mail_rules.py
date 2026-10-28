"""
Pipeline regression tests for email-source rules, reply/forward handling, status updates,
idempotency and failure recovery.

Uses sanitized fixtures (fictitious people, configured trusted client domains), a temporary
SQLite store, and mocked backend calls: no mailbox, LLM or production database is touched.

Run:  .venv\\Scripts\\python.exe -m unittest discover -s tests -v
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
for p in [str(ROOT), str(ROOT / "src"), str(ROOT / "src" / "email_extraction")]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("METAFORGE_MODE", "api")
os.environ.setdefault("METAFORGE_API_URL", "http://127.0.0.1:9")  # never reached: calls are mocked
os.environ["OUTBOUND_EMAIL_ENABLED"] = "false"
# Tests never read the live mailbox; the reconcile step (which lists real inbox mail) stays off.
os.environ["MAIL_RECONCILE_ENABLED"] = "false"

# Tests never call the real AI model (it costs quota and makes results depend on the network).
# Any model call fails with a non-network error, so extraction takes its deterministic paths.
import openai  # noqa: E402


class _NoAIInTests:
    def __init__(self, *args, **kwargs):
        self.chat = self
        self.completions = self

    def create(self, *args, **kwargs):
        raise AssertionError("tests must not call the real AI model")


openai.OpenAI = _NoAIInTests

import main  # noqa: E402
from config import Settings  # noqa: E402
from processed_store import ProcessedStore  # noqa: E402
from thread_splitter import header_row_for, split_thread  # noqa: E402

HEADER = "Request-ID | Equivalent Grade | Skills - Name | Location Flex | RTO/Hybrid/WFH | Budget/monthly | Relevant Exp | Education | Priority | No of profiles |"
ROW_A = "301001-1 | 9 | SAP FI CO Finance | Mumbai(MDC-5) | RTO | 2.17 Lakhs | 5 Yrs | Any Graduation | P1 |  |"
ROW_B = "301002-1 | 10 | SAP BTP Datasphere | Hyderabad(HDC3) | RTO | 1.40 Lakhs | 4 Yrs | Any Graduation | P1 |  |"
ROW_NEW = "301009-1 | 9 | SAP FSCM Treasury and Risk Management (TRM) | Bangalore(BDC14) | RTO | 2.40 Lakhs | 6 Yrs | Any Graduation | P2"

QUOTED_TABLE = (
    "From: Asha Client <asha.client@iexcel.co.in>\n"
    "Sent: Tuesday, October 20, 2026 10:26 AM\n"
    "To: Hiring <hiring@iexcel.co.in>; offshorejobs@metaforgeit.com\n"
    "Subject: Accenture Open demands for 20th Oct\n"
    "Hi All,\nPFB\n"
    f"{HEADER}\n{ROW_A}\n{ROW_B}\n"
    "Thanks & Regards\nAsha"
)


def raw_message(gid: str, sender: str, subject: str, body: str, *, received: str = "2026-10-20T05:00:00Z",
                conversation: str = "conv-1", cc: list[str] | None = None) -> dict:
    return {
        "id": gid,
        "internetMessageId": f"<{gid}@example.test>",
        "conversationId": conversation,
        "subject": subject,
        "from": {"emailAddress": {"address": sender, "name": "Test Sender"}},
        "sender": {"emailAddress": {"address": sender, "name": "Test Sender"}},
        "toRecipients": [{"emailAddress": {"address": "recruitment.application@metaforgeit.com"}}],
        "ccRecipients": [{"emailAddress": {"address": a}} for a in (cc or [])],
        "receivedDateTime": received,
        "body": {"contentType": "text", "content": body},
        "hasAttachments": False,
    }


class PipelineCase(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.db_path = str(Path(self.tmp.name) / "processed.db")
        self.settings = Settings.from_env()
        self.sent: list[dict] = []
        self.status_updates: list[dict] = []
        self.status_result = {"matched": True, "reqCode": "2026-10-20-001"}

        def fake_send(payload, settings):
            self.sent.append(dict(payload))
            return f"2026-10-20-{len(self.sent):03d}"

        def fake_status(update, settings):
            self.status_updates.append(dict(update))
            return dict(self.status_result)

        self.patches = [
            mock.patch.object(main, "send_to_metaforge", side_effect=fake_send),
            mock.patch.object(main, "send_status_update", side_effect=fake_status),
        ]
        for p in self.patches:
            p.start()
        self.store = ProcessedStore(self.db_path).__enter__()

    def tearDown(self) -> None:
        self.store.__exit__(None, None, None)
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def run_msg(self, raw: dict) -> int:
        return main.process_single_message(
            raw, token="unused", mailbox="mailbox@example.test", settings=self.settings,
            allocator=None, store=self.store, skip_classifier=True,
        )

    def sent_ids(self) -> list[str]:
        return [str(p.get("client_jd_id")) for p in self.sent]

    def pending_reviews(self) -> list[tuple]:
        return self.store._conn.execute("SELECT graph_id, review_fields FROM pending_reviews").fetchall()


class SourceRules(PipelineCase):
    def test_05_internal_reply_does_not_create(self):
        body = f"Team, see the client demands below.\n\n{QUOTED_TABLE}"
        self.run_msg(raw_message("int-reply-1", "recruiter@metaforgeit.com", "Re: Accenture Open demands for 20th Oct", body))
        self.assertEqual(self.sent, [], "internal reply must not create or update requirements")
        self.assertEqual(self.status_updates, [])
        self.assertTrue(self.store.pipeline_should_skip("int-reply-1"), "message is finalized, not retried forever")

    def test_06_internal_forward_with_quoted_client_text_goes_to_review(self):
        body = f"FYI please work on these.\n\n{QUOTED_TABLE}"
        self.run_msg(raw_message("int-fwd-1", "ceo.office@metaforgeit.com", "FW: Accenture Open demands for 20th Oct", body))
        self.assertEqual(self.sent, [], "internal forward must not independently create requirements")
        reviews = self.pending_reviews()
        self.assertEqual(len(reviews), 1, "client data seen only via internal mail is queued for review")
        self.assertIn("internal_sender", reviews[0][1])

    def test_internal_chatter_is_filtered_not_queued(self):
        self.run_msg(raw_message("int-chat-1", "intern@metaforgeit.com", "Request for Current Open Requirements",
                                 "Hi, could you please share the active openings? Regards"))
        self.assertEqual(self.sent, [])
        self.assertEqual(self.pending_reviews(), [])

    def test_client_email_with_internal_cc_is_still_processed(self):
        body = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\n{ROW_B}\nThanks"
        self.run_msg(raw_message("client-new-1", "asha.client@iexcel.co.in", "Accenture Open demands for 20th Oct", body,
                                 cc=["boss@metaforgeit.com"]))
        self.assertEqual(sorted(self.sent_ids()), ["301001-1", "301002-1"])
        for p in self.sent:
            self.assertEqual(p.get("source_sender_email"), "asha.client@iexcel.co.in")


class ReplyRules(PipelineCase):
    def test_client_reply_uses_only_new_text_row(self):
        body = f"{ROW_B.replace('P1', 'Hold')}\nThanks & Regards\nAsha\n\n{QUOTED_TABLE}"
        self.run_msg(raw_message("client-reply-hold", "asha.client@iexcel.co.in", "Re: Accenture Open demands for 20th Oct", body))
        self.assertEqual(self.sent_ids(), ["301002-1"], "only the row in the new text is applied")
        self.assertEqual(str(self.sent[0].get("job_status")).lower(), "hold")
        self.assertEqual(self.sent[0].get("job_title"), "SAP BTP Datasphere", "columns mapped via the quoted header row")

    def test_15_new_requirement_in_reply_is_not_missed(self):
        body = f"Adding New Req ID:\n{HEADER}\n{ROW_NEW}\nThanks\n\n{QUOTED_TABLE}"
        self.run_msg(raw_message("client-reply-new", "asha.client@iexcel.co.in", "Re: Accenture open demands for 30th Sep", body))
        self.assertEqual(self.sent_ids(), ["301009-1"], "new requirement created; quoted existing rows not re-applied")

    def test_stop_sourcing_reply_updates_status_only(self):
        quoted = ("From: Kiran Lead\nSent: 11 September 2026 18:39\nTo: Partner Team\n"
                  "Subject: TPC - Requirement - Mobility Cluster Developer_Bangalore\n"
                  "Role: Cluster Developer\nExperience: 4+ years\nLocation: Bangalore\n")
        body = f"Partner - Pls stop on this demand\nRgds/Kiran\n\n{quoted}"
        self.run_msg(raw_message("ltts-stop-1", "kiran.lead@ltts.com", "RE: TPC - Requirement - Mobility Cluster Developer_Bangalore", body))
        self.assertEqual(self.sent, [], "a status reply never creates a requirement")
        self.assertEqual(len(self.status_updates), 1)
        self.assertEqual(self.status_updates[0]["job_status"], "hold")
        self.assertEqual(self.status_updates[0]["status_reason"], "stop_sourcing")

    def test_unmatched_status_reply_is_queued_not_dropped(self):
        self.status_result = {"matched": False, "reason": "No existing requirement matches"}
        body = "Partner - Pls stop on this demand\n\nFrom: Kiran Lead\nSent: 1 October 2026\nTo: Partner\nSubject: TPC - Requirement - Unknown Role\n"
        self.run_msg(raw_message("ltts-stop-2", "kiran.lead@ltts.com", "RE: TPC - Requirement - Unknown Role", body))
        self.assertEqual(self.sent, [])
        self.assertTrue(any("status_update_unmatched" in r[1] for r in self.pending_reviews()))

    def test_chatter_reply_changes_nothing(self):
        body = ("Partner - Pls share more profiles\nRgds/Kiran\n\n"
                "From: Kiran Lead\nSent: 09 October 2026 15:39\nTo: Partner\nSubject: TPC - Requirement - PCB Layout Engineers\n"
                "Role: PCB Layout Engineer\nExperience: 8+ years\nLocation: Chennai\nBudget: 1.8 L/month\n")
        self.run_msg(raw_message("ltts-chat-1", "kiran.lead@ltts.com", "RE: TPC - Requirement - PCB Layout Engineers", body))
        self.assertEqual(self.sent, [], "quoted JD in a chatter reply must not create a requirement")
        self.assertEqual(self.status_updates, [])

    def test_ambiguous_identity_is_queued_and_other_rows_continue(self):
        from metaforge_api import NeedsReview

        def picky_send(payload, settings):
            if payload.get("client_jd_id") == "301001-1":
                raise NeedsReview("Possible duplicate of 2026-10-10-004", ["2026-10-10-004"])
            self.sent.append(dict(payload))
            return "2026-10-20-002"

        body = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\n{ROW_B}\nThanks"
        with mock.patch.object(main, "send_to_metaforge", side_effect=picky_send):
            self.run_msg(raw_message("client-amb-1", "asha.client@iexcel.co.in", "Accenture Open demands for 20th Oct", body))
        self.assertEqual(self.sent_ids(), ["301002-1"], "the unambiguous row is still created")
        self.assertTrue(any(r[1].startswith("ambiguous_identity") for r in self.pending_reviews()), "ambiguous row queued")

    def test_one_hold_row_does_not_put_whole_list_on_hold(self):
        day1 = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\n{ROW_B}\nThanks"
        self.run_msg(raw_message("list-day1", "asha.client@iexcel.co.in", "Accenture Open demands for 20th Oct", day1, conversation="c-d1"))
        self.sent.clear()
        day2 = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\n{ROW_B.replace('| P1 |', '| Hold |')}\nThanks"
        self.run_msg(raw_message("list-day2", "asha.client@iexcel.co.in", "Accenture Open demands for 21st Oct", day2,
                                 received="2026-10-21T05:00:00Z", conversation="c-d2"))
        status = {p.get("client_jd_id"): str(p.get("job_status")).lower() for p in self.sent}
        self.assertEqual(status.get("301002-1"), "hold", "the Hold row is put on hold")
        self.assertEqual(status.get("301001-1"), "open", "other rows keep their own status (P1 = open)")

    def test_same_title_rows_with_different_ids_all_kept(self):
        rows = [
            "303486-1 | 9 | Embedded C++ | PAN India | RTO | 2.80 Lakhs(Budget Flex) | 5 Yrs | Any Graduation | P1",
            "303489-1 | 9 | Embedded C++ | PAN India | RTO | 2.80 Lakhs(Budget Flex) | 5 Yrs | Any Graduation | P1",
            "303495-1 | 10 | Embedded C++ | PAN India | RTO | 2.45 Lakhs(Budget Flex) | 4 Yrs | Any Graduation | P1",
        ]
        body = "Hi All,\nPFB\n" + HEADER + "\n" + "\n".join(rows) + "\nThanks"
        self.run_msg(raw_message("same-title-1", "asha.client@iexcel.co.in", "Accenture open demands for 22nd Oct", body))
        self.assertEqual(sorted(self.sent_ids()), ["303486-1", "303489-1", "303495-1"])
        keys = {p.get("idempotencyKey") for p in self.sent}
        self.assertEqual(len(keys), 3, "each row has its own retry key")
        for p in self.sent:
            self.assertEqual(p.get("location"), "PAN India", "PAN India is kept as the location")

    def test_adding_new_req_reply_maps_every_column(self):
        row = "312866-1 | 10 | SAP for Utilities Cust Financial Mgt FICA | Pune(PDC-3) | RTO | 1.65 Lakhs | 4 Yrs | Any Graduation | P2"
        body = f"Adding New Req ID:\n{row}\nReq ID: 312866-1\nJob Description: | 10 PDC3B Key Responsibilities ...\n\n{QUOTED_TABLE}"
        self.run_msg(raw_message("add-new-req-1", "asha.client@iexcel.co.in", "Re: Accenture open demands for 30th Sep", body))
        self.assertEqual(self.sent_ids(), ["312866-1"])
        p = self.sent[0]
        self.assertEqual(p.get("job_title"), "SAP for Utilities Cust Financial Mgt FICA")
        self.assertEqual(p.get("location"), "Pune(PDC-3)")
        self.assertIn("4", str(p.get("overall_experience")), "experience from the row")
        self.assertEqual(str(p.get("monthly_budget")), "165000", "budget from this row, not another")
        self.assertEqual(p.get("work_mode"), "On-site", "RTO, not Hybrid from the header text")

    def test_cancel_reply_listing_rows_updates_each_row(self):
        rows = (
            "302970-1 | 9 | SAP BusinessObjects Data Services | Bangalore(BDC14) | RTO | 2.45 Lakhs | 5 Yrs | Any Graduation | Hold\n"
            "300968-1 | 9 | SAP CO Management Accounting | PAN India | RTO | 2.50 Lakhs | 5 Yrs | Any Graduation | Hold"
        )
        body = f"Dont support on below req its cancelled\n{rows}\nThanks & Regards\nAsha\n\n{QUOTED_TABLE}"
        main.process_single_message(raw_message("cancel-rows-1", "asha.client@iexcel.co.in", "Re: Accenture open demands for 15th Oct", body), token="t", mailbox="m", settings=self.settings, allocator=None, store=self.store, skip_classifier=False)
        self.assertEqual(self.sent, [], "a cancellation never creates requirements")
        got = sorted((u["client_jd_id"], u["job_status"]) for u in self.status_updates)
        self.assertEqual(got, [("300968-1", "closed"), ("302970-1", "closed")])

    def test_09_reprocessing_same_message_is_idempotent(self):
        body = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\nThanks"
        raw = raw_message("client-dup-1", "asha.client@iexcel.co.in", "Accenture Open demands for 20th Oct", body)
        self.run_msg(raw)
        first = len(self.sent)
        self.run_msg(raw)  # e.g. after a scheduler restart
        self.assertEqual(first, 1)
        self.assertEqual(len(self.sent), first, "second pass must not resend")


class SingleJdAndCoverage(unittest.TestCase):
    def _p(self, title, loc="As per business requirement", budget="320000", exp="7+ years"):
        return {"job_title": title, "location": loc, "monthly_budget": budget, "overall_experience": exp, "client_jd_id": None}

    def test_ai_split_of_one_jd_is_collapsed(self):
        out = main._collapse_single_jd_split(
            [self._p("SAP IBP Consultant", exp="7 +"), self._p("SAP IBP+OBP", exp="7+ years in SAP Supply Chain Planning (suggested)")],
            "Quick Connect-Critical requirement-SAP IBP+OBP-3PT",
        )
        self.assertEqual([p["job_title"] for p in out], ["SAP IBP+OBP"], "one requirement, title closest to the subject")

    def test_distinct_roles_stay_separate(self):
        out = main._collapse_single_jd_split(
            [self._p("Java Developer", "Bangalore", "150000", "5 years"), self._p("Python Developer", "Bangalore", "150000", "5 years")],
            "Requirements - Java and Python developers",
        )
        self.assertEqual(len(out), 2)
        out = main._collapse_single_jd_split([self._p("SAP IBP Consultant", "Pune"), self._p("SAP IBP+OBP", "Delhi")], "SAP IBP")
        self.assertEqual(len(out), 2, "different locations are different requirements")


class RowCoverage(PipelineCase):
    def test_row_not_extracted_goes_to_review(self):
        body = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\n{ROW_B}\nThanks"
        real = main.extract_and_map

        def drop_second_row(*a, **k):
            status, payloads, txt = real(*a, **k)
            return status, [p for p in payloads if p.get("client_jd_id") != "301002-1"], txt

        with mock.patch.object(main, "extract_and_map", side_effect=drop_second_row):
            self.run_msg(raw_message("coverage-1", "asha.client@iexcel.co.in", "Accenture Open demands for 20th Oct", body))
        self.assertEqual(self.sent_ids(), ["301001-1"])
        self.assertIn(("coverage-1", "row_not_extracted"), self.pending_reviews())


class ClientIdRules(unittest.TestCase):
    def test_generic_count_labels_are_not_client_ids(self):
        from requirement_identity import clean_client_jd_id

        for fake in ("OPENPOSITION-1", "Open Position-1", "Opening 2", "Role-3"):
            self.assertIsNone(clean_client_jd_id(fake), fake)
        self.assertEqual(clean_client_jd_id("212883-1"), "212883-1")

    def test_labelled_id_is_used_for_single_requirement_email(self):
        self.assertEqual(main._single_labeled_id("Location: Delhi\nJP ID: DLTJP00063583", "deloitte"), "DLTJP00063583")
        self.assertIsNone(main._single_labeled_id("Req ID: 212866-1\nReq ID: 213015-1"), "two labelled IDs: no override")


class Reconciliation(unittest.TestCase):
    def setUp(self):
        import reconciler

        self.rec = reconciler
        self.tmp = tempfile.TemporaryDirectory()
        self.store = ProcessedStore(str(Path(self.tmp.name) / "p.db")).__enter__()
        self.settings = Settings.from_env()

    def tearDown(self):
        self.store.__exit__(None, None, None)
        self.tmp.cleanup()

    def test_listed_ids_cover_rows_and_labels_not_quotes_status_or_internal(self):
        lst = raw_message("l1", "asha.client@iexcel.co.in", "Accenture Open demands", f"PFB\n{HEADER}\n{ROW_A}\nRequest-ID: | 309999-1\nJob Description: | ...")
        self.assertEqual(self.rec.listed_ids(lst), ["301001-1", "309999-1"])
        reply = raw_message("l2", "asha.client@iexcel.co.in", "Re: Accenture Open demands", f"{ROW_B}\nThanks\n\n{QUOTED_TABLE}")
        self.assertEqual(self.rec.listed_ids(reply), ["301002-1"], "quoted rows are not listed by this email")
        cancel = raw_message("l3", "asha.client@iexcel.co.in", "Re: demands", f"Dont support on below req its cancelled\n{ROW_A}\n\n{QUOTED_TABLE}")
        self.assertEqual(self.rec.listed_ids(cancel), [])
        internal = raw_message("l4", "ops@metaforgeit.com", "FW: demands", f"FYI\n{HEADER}\n{ROW_A}")
        self.assertEqual(self.rec.listed_ids(internal), [])

    def test_missing_id_is_reprocessed_then_recovered(self):
        state = {"exists": set()}
        msg = raw_message("r1", "asha.client@iexcel.co.in", "Accenture Open demands", f"PFB\n{HEADER}\n{ROW_A}")
        calls = []

        def presence(ids, settings):
            ids = list(ids)
            return {"live": [i for i in ids if i in state["exists"]], "deleted": [], "missing": [i for i in ids if i not in state["exists"]]}

        def reprocess(raw):
            calls.append(raw["id"])
            state["exists"].add("301001-1")

        with mock.patch.object(self.rec, "check_presence", side_effect=presence):
            out = self.rec.reconcile([msg], settings=self.settings, store=self.store, reprocess=reprocess)
        self.assertEqual(calls, ["r1"])
        self.assertEqual(out["recovered"], ["301001-1"])
        self.assertEqual(out["stillMissing"], [])

    def test_still_missing_goes_to_review_once_and_is_not_retried_forever(self):
        msg = raw_message("r2", "asha.client@iexcel.co.in", "Accenture Open demands", f"PFB\n{HEADER}\n{ROW_B}")
        calls = []
        presence = lambda ids, s: {"live": [], "deleted": [], "missing": list(ids)}  # noqa: E731
        with mock.patch.object(self.rec, "check_presence", side_effect=presence):
            for _ in range(3):  # three scheduler runs
                out = self.rec.reconcile([msg], settings=self.settings, store=self.store, reprocess=lambda raw: calls.append(raw["id"]))
        self.assertEqual(calls, ["r2"], "re-processed once, not on every run")
        self.assertEqual(out["stillMissing"], ["301002-1"])
        rows = self.store._conn.execute("SELECT review_fields FROM pending_reviews WHERE graph_id='r2'").fetchall()
        self.assertEqual(rows, [("listed_but_missing",)], "one review entry, not one per run")


class ThreadSplitter(unittest.TestCase):
    def test_outlook_header_block_is_quote(self):
        t = split_thread(f"Hold this one\n\n{QUOTED_TABLE}", "Re: x")
        self.assertEqual(t.new_text, "Hold this one")
        self.assertTrue(t.has_quote)
        self.assertEqual(t.first_quoted_from_domain, "iexcel.co.in")

    def test_from_label_inside_jd_is_not_a_quote(self):
        t = split_thread("Role: Analyst\nFrom: Bangalore office\nExperience: 3 years", "New requirement")
        self.assertFalse(t.has_quote)

    def test_header_hint_is_column_names_only(self):
        hdr = header_row_for(ROW_B, QUOTED_TABLE)
        self.assertEqual(hdr, HEADER)


class FailureRecovery(unittest.TestCase):
    def test_18_repeated_failures_are_quarantined_and_do_not_block_later_mail(self):
        import scripts.sync_to_backend as sync

        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        db = str(Path(tmp.name) / "processed.db")
        good_body = f"Hi All,\nPFB\n{HEADER}\n{ROW_A}\nThanks"
        bad = raw_message("fail-1", "asha.client@iexcel.co.in", "Accenture Open demands A", f"Hi\nPFB\n{HEADER}\n{ROW_B}\n", received="2026-10-21T05:00:00Z")
        good = raw_message("ok-1", "asha.client@iexcel.co.in", "Accenture Open demands B", good_body, received="2026-10-21T06:00:00Z")
        sent: list[str] = []

        def flaky_send(payload, settings):
            if payload.get("graphMessageId") == "fail-1":
                raise RuntimeError("backend unavailable")
            sent.append(payload.get("client_jd_id"))
            return "2026-10-21-001"

        env = {"PROCESSED_DB": db, "METAFORGE_MODE": "api", "MAIL_EXTRACTION_MAX_ATTEMPTS": "3", "INGEST_START_DATETIME": "2026-09-01T00:00:00Z"}
        with mock.patch.dict(os.environ, env), \
                mock.patch.object(sync, "acquire_token_from_env", return_value="t"), \
                mock.patch.object(sync, "iter_inbox_messages", side_effect=lambda *a, **k: iter([bad, good])), \
                mock.patch.object(main, "send_to_metaforge", side_effect=flaky_send), \
                mock.patch.object(main, "send_status_update", return_value={"matched": True}), \
                mock.patch.object(sys, "argv", ["sync_to_backend.py", "--limit", "25"]):
            for _ in range(3):  # three scheduler cycles (also simulates restarts: state lives in SQLite)
                self.assertEqual(sync.main(), 0)

        self.assertEqual(sent.count("301001-1"), 1, "later genuine mail processed once, not blocked by the failing one")
        with ProcessedStore(db) as store:
            reviews = store._conn.execute("SELECT graph_id, review_fields FROM pending_reviews").fetchall()
            self.assertIn(("fail-1", "processing_failed_repeatedly"), reviews, "failing mail is parked for review, not lost")
            self.assertTrue(store.pipeline_should_skip("fail-1"))
            self.assertGreaterEqual(store.get_watermark() or "", "2026-10-21T05:00:00Z", "watermark advances once the failure is quarantined")

    def test_ai_unavailable_holds_mail_and_resumes_when_back(self):
        """Quota used up: nothing is saved or quarantined; the same mail is processed once the AI is back."""
        import scripts.sync_to_backend as sync
        from llm_health import LLMUnavailable

        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        db = str(Path(tmp.name) / "processed.db")
        msg = raw_message("held-1", "asha.client@iexcel.co.in", "Accenture Open demands C", f"Hi\nPFB\n{HEADER}\n{ROW_A}\n", received="2026-10-22T05:00:00Z")
        sent: list[str] = []
        ai_down = {"on": True}
        real_extract = main.extract_and_map

        def extract(*a, **k):
            if ai_down["on"]:
                raise LLMUnavailable("429 RESOURCE_EXHAUSTED: quota exceeded")
            return real_extract(*a, **k)

        def send(payload, settings):
            sent.append(payload.get("client_jd_id"))
            return "2026-10-22-001"

        env = {"PROCESSED_DB": db, "METAFORGE_MODE": "api", "MAIL_EXTRACTION_MAX_ATTEMPTS": "2", "INGEST_START_DATETIME": "2026-09-01T00:00:00Z"}
        with mock.patch.dict(os.environ, env), \
                mock.patch.object(sync, "acquire_token_from_env", return_value="t"), \
                mock.patch.object(sync, "iter_inbox_messages", side_effect=lambda *a, **k: iter([msg])), \
                mock.patch.object(main, "extract_and_map", side_effect=extract), \
                mock.patch.object(main, "send_to_metaforge", side_effect=send), \
                mock.patch.object(main, "send_status_update", return_value={"matched": True}), \
                mock.patch.object(sys, "argv", ["sync_to_backend.py", "--limit", "25"]):
            for _ in range(3):  # more runs than MAIL_EXTRACTION_MAX_ATTEMPTS while the AI is down
                self.assertEqual(sync.main(), 0)
            self.assertEqual(sent, [], "nothing is saved from a degraded extraction")
            with ProcessedStore(db) as store:
                self.assertFalse(store.pipeline_should_skip("held-1"), "held mail is not finalized")
                self.assertEqual(store._conn.execute("SELECT COUNT(*) FROM pending_reviews").fetchone()[0], 0, "not quarantined")
                self.assertLess(store.get_watermark() or "", "2026-10-22T05:00:00Z", "watermark stays before held mail")
            ai_down["on"] = False
            self.assertEqual(sync.main(), 0)
        self.assertEqual(sent, ["301001-1"], "processed normally once the AI is back")


class FieldAccuracy(unittest.TestCase):
    """Skill, work-mode and conflict rules from the 2026-10-16 accuracy pass."""

    def test_junk_values_are_not_skills(self):
        from two_way_verifier import is_junk_skill

        for junk in ("12 PM", "Work hrs 12 PM - 10 PM", "engineer"):
            self.assertTrue(is_junk_skill(junk, "Data Engineer"), junk)
        for skill in ("Java", "SAP ABAP", "Spring Boot", "Data Engineer"):
            self.assertFalse(is_junk_skill(skill, "Data Engineer"), skill)

    def test_body_work_mode_needs_an_explicit_statement(self):
        from field_mapper import _classify_body_work_mode

        self.assertIsNone(_classify_body_work_mode("RPP (Remote power panel) experience"))
        self.assertIsNone(_classify_body_work_mode("2 days interview process"))
        self.assertEqual(_classify_body_work_mode("Work Mode: Hybrid"), "Hybrid")
        self.assertEqual(_classify_body_work_mode("3 days from office"), "Hybrid")
        self.assertEqual(_classify_body_work_mode("This is a fully remote role"), "Remote")
        self.assertEqual(_classify_body_work_mode("Location: Pune, WFO"), "On-site")

    def test_empty_skill_label_skips_side_facts(self):
        from two_way_verifier import deterministic_extract_block

        block = "Job Title: Java Developer\nMandatory Skills –\nWork hrs – 12 PM – 10 PM\nJava, Spring Boot\nLocation - Pune\n"
        det = deterministic_extract_block(block)
        self.assertEqual(det.get("mandatory_skills"), ["Java", "Spring Boot"])
        self.assertTrue(det["quotes"]["mandatory_skills"].endswith("Java, Spring Boot"))

    def test_empty_label_followed_by_another_field_stays_empty(self):
        from two_way_verifier import deterministic_extract_block

        det = deterministic_extract_block("Job Title: Java Developer\nMandatory Skills –\nLocation - Pune\n")
        self.assertFalse(det.get("mandatory_skills"))

    def test_conflicting_values_are_not_merged(self):
        from two_way_verifier import deterministic_extract_block, reconcile_two_way

        block = "Job Title: Java Developer\nLocation: Pune\nMandatory Skills: Java, Spring Boot\n"
        det = deterministic_extract_block(block)
        ai = {"job_title": "Java Developer", "location": ["South India"], "mandatory_skills": ["Java", "Spring Boot"]}
        rec, _review, _reasons = reconcile_two_way(ai, det, block)
        self.assertEqual(rec["location"], ["Pune"], "the client's labelled line wins, values are not mixed")

    def test_tiered_budget_keeps_every_tier(self):
        from two_way_verifier import deterministic_extract_block

        block = (
            "Job Title - Mould Design Engineer\nBill Rate per month for TPC (in terms of INR)-\n"
            "3 – 4 yrs – 90 K\n4 – 5 yrs – 1.2 L\n5 + yrs - 1.3 L\nWork location – Chennai\n"
        )
        det = deterministic_extract_block(block)
        self.assertIn("90 K", det.get("budget") or "")
        self.assertIn("1.3 L", det.get("budget") or "", "the last tier is not dropped")
        self.assertNotIn("Chennai", det.get("budget") or "")

    def test_experience_keeps_decimals_and_open_maximum(self):
        from field_mapper import extract_min_max_experience

        self.assertEqual(extract_min_max_experience("7.5 Yrs"), (7.5, 7.5))
        self.assertEqual(extract_min_max_experience("5 + Years"), (5, None))
        self.assertEqual(extract_min_max_experience("3 – 7 years"), (3, 7))


if __name__ == "__main__":
    unittest.main(verbosity=2)
