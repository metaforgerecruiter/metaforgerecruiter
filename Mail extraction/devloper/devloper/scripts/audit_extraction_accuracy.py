"""
Read-only extraction accuracy audit.

Re-extracts the source email of every live requirement with the current pipeline code (same reply
scoping as production) and lists each field where the stored record differs from what the email says.
Nothing is written: no backend calls, no SQLite writes, no mailbox changes.

Usage:
  node test/export_live_requirements.js live.json              (from backend/, so its .env is loaded)
  python scripts/audit_extraction_accuracy.py live.json [--out report.json] [--only REQCODE ...]

A difference is not automatically an error: a later verified client email may have updated the record
(budget, status, ...). Check the listed differences against the requirement's history.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
for p in (ROOT, ROOT / "src" / "email_extraction", ROOT / "src"):
    sys.path.insert(0, str(p))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env")

import main  # noqa: E402
from config import Settings  # noqa: E402
from outlook_graph import _token_client_credentials, fetch_message_by_id  # noqa: E402
from thread_splitter import split_thread  # noqa: E402


def _norm(v: object) -> str:
    return re.sub(r"[^a-z0-9+#.]+", " ", str(v or "").lower()).strip()


def _parts(v: object) -> set[str]:
    items = v if isinstance(v, list) else re.split(r"[,/;|]+", str(v or ""))
    return {_norm(x) for x in items if _norm(x)}


def _sender(raw: dict) -> str:
    return str(((raw.get("from") or {}).get("emailAddress") or {}).get("address") or "").strip()


def extract_for_message(raw: dict, token: str, settings: Settings) -> tuple[str, list[dict]]:
    plain, _html, norm = main._body_from_raw(raw)
    thread = split_thread(plain, str(raw.get("subject") or ""))
    scope = main.extraction_scope(raw, thread, _sender(raw))
    if thread.has_quote and scope is None:
        return "reply_without_new_requirement", []
    status, payloads, _ = main.extract_and_map(
        raw, token=token, mailbox=settings.mailbox_upn, settings=settings, skip_classifier=True, body_override=scope
    )
    return status, payloads


def pair(records: list[dict], payloads: list[dict]) -> list[tuple[dict, dict | None]]:
    out, used = [], set()
    for r in records:
        cid = str(r.get("sourceClientJdId") or "").strip()
        match = None
        for i, p in enumerate(payloads):
            if i in used:
                continue
            if cid and str(p.get("client_jd_id") or "").strip() == cid:
                match = i
                break
        if match is None:
            for i, p in enumerate(payloads):
                if i not in used and _norm(p.get("job_title")) == _norm(r.get("title")):
                    match = i
                    break
        if match is None and len(records) == 1 and len(payloads) == 1:
            # Only pair a lone record with a lone row when their client IDs do not contradict each other.
            pid = str(payloads[0].get("client_jd_id") or "").strip()
            if not (cid and pid and cid != pid):
                match = 0
        if match is not None:
            used.add(match)
        out.append((r, payloads[match] if match is not None else None))
    return out


def compare(r: dict, p: dict) -> dict[str, tuple[object, object]]:
    diffs: dict[str, tuple[object, object]] = {}
    if _norm(r.get("title")) != _norm(p.get("job_title")):
        diffs["title"] = (r.get("title"), p.get("job_title"))
    if _parts(r.get("location")) != _parts(p.get("location")):
        diffs["location"] = (r.get("location"), p.get("location"))
    if _norm(r.get("workMode")) != _norm(p.get("work_mode")):
        diffs["workMode"] = (r.get("workMode"), p.get("work_mode"))
    er = r.get("experienceRange") or {}
    pe = (p.get("overall_experience_min"), p.get("overall_experience_max"))
    if (er.get("min"), er.get("max")) != pe and any(x is not None for x in pe):
        diffs["experience"] = ((er.get("min"), er.get("max")), pe)
    if p.get("number_of_positions") is not None and r.get("openings") != p.get("number_of_positions"):
        diffs["openings"] = (r.get("openings"), p.get("number_of_positions"))
    if _parts(r.get("mandatorySkills")) != _parts(p.get("mandatory_skills")):
        diffs["mandatorySkills"] = (r.get("mandatorySkills"), p.get("mandatory_skills"))
    if _norm(r.get("budgetText")) != _norm(p.get("budget_text") or p.get("budget")):
        diffs["budgetText"] = (r.get("budgetText"), p.get("budget_text") or p.get("budget"))
    return diffs


def main_cli() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("records")
    ap.add_argument("--out", default="")
    ap.add_argument("--only", nargs="*", default=[])
    args = ap.parse_args()

    records = json.loads(Path(args.records).read_text(encoding="utf-8"))
    if args.only:
        records = [r for r in records if r.get("reqCode") in set(args.only)]
    by_msg: dict[str, list[dict]] = defaultdict(list)
    for r in records:
        by_msg[r["sourceMessageId"]].append(r)

    settings = Settings.from_env()
    token = _token_client_credentials(settings.azure_tenant_id, settings.azure_client_id, settings.azure_client_secret)
    report, n_ok, n_diff, n_unmatched = [], 0, 0, 0
    for mid, recs in by_msg.items():
        raw = fetch_message_by_id(token, settings.mailbox_upn, mid)
        if not raw:
            for r in recs:
                report.append({"reqCode": r["reqCode"], "result": "source_email_not_found"})
            continue
        status, payloads = extract_for_message(raw, token, settings)
        for r, p in pair(recs, payloads):
            if p is None:
                n_unmatched += 1
                report.append({"reqCode": r["reqCode"], "title": r.get("title"), "result": "not_re_extracted",
                               "status": status, "subject": raw.get("subject")})
                continue
            diffs = compare(r, p)
            if diffs:
                n_diff += 1
            else:
                n_ok += 1
            keep = ("job_title", "location", "work_mode", "overall_experience", "experience", "experience_text",
                    "overall_experience_min", "overall_experience_max", "budget", "budget_text", "yearly_budget",
                    "yearly_budget_min", "yearly_budget_max", "monthly_budget", "monthly_budget_min",
                    "monthly_budget_max", "budget_currency", "mandatory_skills", "skills", "number_of_positions")
            report.append({"reqCode": r["reqCode"], "clientId": r.get("sourceClientJdId"), "title": r.get("title"),
                           "sourceMessageId": mid, "result": "differs" if diffs else "matches",
                           "diffs": {k: {"stored": a, "email": b} for k, (a, b) in diffs.items()},
                           "payload": {k: p.get(k) for k in keep}})

    for row in report:
        if row["result"] == "matches":
            continue
        print(f"\n{row['reqCode']} ({row.get('clientId') or '-'}) {row.get('title')}: {row['result']}")
        for k, v in (row.get("diffs") or {}).items():
            print(f"   {k}: stored={v['stored']!r}\n   {' ' * len(k)}  email ={v['email']!r}")
        if row["result"] == "not_re_extracted":
            print(f"   status={row.get('status')} subject={row.get('subject')!r}")
    print(f"\nSUMMARY matches={n_ok} differs={n_diff} not_re_extracted={n_unmatched} total={len(report)}")
    if args.out:
        Path(args.out).write_text(json.dumps(report, indent=1, ensure_ascii=False, default=str), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main_cli())
