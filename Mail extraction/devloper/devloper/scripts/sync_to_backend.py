#!/usr/bin/env python3
"""
Bridge script: Synchronizes requirements from Microsoft 365 Outlook inbox
into the Version 2 MetaForge backend using shared V1 extraction modules.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote

import requests

ROOT = Path(__file__).resolve().parents[1]
for p in [str(ROOT), str(ROOT / "src"), str(ROOT / "src" / "email_extraction")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from config import Settings
from processed_store import ProcessedStore
from outlook_graph import acquire_token_from_env, iter_inbox_messages, GRAPH, _encode_user
from metaforge_api import IdAllocator
from main import process_single_message, _parse_to_utc_dt, get_effective_cutoff_iso
from reconciler import reconcile
from llm_health import LLMUnavailable
from utils import setup_logging

_LOG = logging.getLogger("sync_to_backend")


def iter_historical_messages(
    token: str,
    mailbox: str,
    *,
    start_iso: str,
    end_iso: str,
    limit: int = 50,
):
    select = (
        "id,subject,from,sender,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments,"
        "isRead,internetMessageId,conversationId"
    )
    filt = f"receivedDateTime ge {start_iso} and receivedDateTime lt {end_iso}"
    url = (
        f"{GRAPH}/users/{_encode_user(mailbox)}/mailFolders/inbox/messages"
        f"?$orderby=receivedDateTime asc&$select={select}&$top={min(50, limit)}"
        f"&$filter={quote(filt, safe='')}"
    )
    headers = {"Authorization": f"Bearer {token}"}
    count = 0
    while url and count < limit:
        r = requests.get(url, headers=headers, timeout=120)
        r.raise_for_status()
        payload = r.json()
        for m in payload.get("value", []):
            yield m
            count += 1
            if count >= limit:
                break
        url = payload.get("@odata.nextLink") if count < limit else None


def _record_failure(store: ProcessedStore, graph_id: str) -> int:
    """Count failed processing attempts per message (the disposition ledger does not)."""
    store._conn.execute(
        """CREATE TABLE IF NOT EXISTS message_failures (
            graph_id TEXT PRIMARY KEY,
            attempts INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
        )"""
    )
    now = datetime.now(timezone.utc).isoformat()
    store._conn.execute(
        """INSERT INTO message_failures (graph_id, attempts, updated_at) VALUES (?, 1, ?)
           ON CONFLICT(graph_id) DO UPDATE SET attempts = attempts + 1, updated_at = excluded.updated_at""",
        (graph_id, now),
    )
    store._conn.commit()
    row = store._conn.execute("SELECT attempts FROM message_failures WHERE graph_id = ?", (graph_id,)).fetchone()
    return int(row[0]) if row else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Synchronize email requirements to MetaForge V2 backend")
    parser.add_argument("--limit", type=int, default=25, help="Maximum number of messages to process")
    parser.add_argument("--mode", choices=["sync", "historical"], default="sync", help="Processing mode")
    parser.add_argument("--days", type=int, default=2, help="Days to backfill in historical mode")
    parser.add_argument("--timezone", default="Asia/Kolkata", help="Timezone name")
    parser.add_argument("--force", action="store_true", help="Force reprocessing even if seen")
    args = parser.parse_args()

    os.chdir(ROOT)
    settings = Settings.from_env()
    setup_logging(settings.log_level)

    mailbox = settings.mailbox_upn or os.environ.get("MAILBOX_UPN", "recruitment.application@metaforgeit.com")
    _LOG.info("Starting sync_to_backend: mode=%s limit=%d mailbox=%s", args.mode, args.limit, mailbox)

    token = acquire_token_from_env()
    id_db = settings.metaforge_sqlite_path if settings.metaforge_mode == "sqlite" else settings.metaforge_id_db
    allocator = IdAllocator(id_db)

    total_fetched = 0
    total_synced = 0
    total_quarantined = 0
    ai_unavailable = None
    start_iso = ""
    end_iso = ""

    with ProcessedStore(settings.processed_db) as store:
        if args.mode == "historical":
            # Historical backfill window: midnight N days ago (in --timezone) up to now, so it
            # overlaps the regular sync window instead of leaving today's early mail unread.
            try:
                from zoneinfo import ZoneInfo

                tz = ZoneInfo(args.timezone)
            except Exception:
                tz = timezone.utc
            now_local = datetime.now(tz)
            start_local = datetime.combine(
                now_local.date() - timedelta(days=max(1, args.days)), datetime.min.time(), tzinfo=tz
            )
            start_iso = start_local.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            end_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            _LOG.info("Historical window: [%s .. %s]", start_iso, end_iso)

            messages = iter_historical_messages(
                token,
                mailbox,
                start_iso=start_iso,
                end_iso=end_iso,
                limit=args.limit,
            )
        else:
            # Only read mail newer than the ingest watermark (oldest first), otherwise every
            # run would re-read the same oldest inbox messages and never reach new mail.
            start_iso = get_effective_cutoff_iso(settings, store) or ""
            _LOG.info("Sync window: receivedDateTime >= %s", start_iso or "(no cutoff)")
            # Already-finalized messages are skipped cheaply and do not count toward --limit,
            # so a backlog of seen mail can never hide newer messages.
            messages = iter_inbox_messages(
                token,
                mailbox,
                limit=min(2000, max(args.limit * 20, 200)),
                min_received_time=start_iso or None,
                orderby="receivedDateTime asc",
            )

        max_attempts = max(1, int(os.environ.get("MAIL_EXTRACTION_MAX_ATTEMPTS", "3") or 3))
        # Advance the watermark across finalized messages (including filtered/skipped ones)
        # until the first message that failed, so a run of non-requirement mail can't stall
        # the window while failures are still retried next run.
        advance_watermark = args.mode == "sync"
        processed_new = 0
        for raw in messages:
            gid = raw.get("id") or ""
            inet_id = str(raw.get("internetMessageId") or "").strip()
            recv = str(raw.get("receivedDateTime") or "")
            subj = str(raw.get("subject") or "")
            already_done = bool(gid) and store.pipeline_should_skip(gid, inet_id)
            if not already_done:
                if processed_new >= args.limit:
                    break
                processed_new += 1
            total_fetched += 1
            _LOG.info("Processing [%d]: %s - %s", total_fetched, gid[:16], subj[:50])

            try:
                synced = process_single_message(
                    raw,
                    token=token,
                    mailbox=mailbox,
                    settings=settings,
                    allocator=allocator,
                    store=store,
                    skip_classifier=False,
                )
                total_synced += synced
            except LLMUnavailable as e:
                # The AI model is unreachable (e.g. daily quota used up). Nothing is saved, no attempt is
                # counted and the watermark stays here, so this and later mail is processed normally on a
                # later run once the model is back.
                ai_unavailable = str(e)[:300]
                _LOG.error("AI extraction unavailable, holding mail from %s until it recovers: %s", recv, ai_unavailable)
                break
            except Exception as e:
                _LOG.warning("Failed processing email %s: %s", gid[:16], e)

            if gid and not store.pipeline_should_skip(gid, inet_id):
                attempts = _record_failure(store, gid)
                if attempts >= max_attempts:
                    # Never lose a possibly genuine requirement: park it where people can see it.
                    _LOG.error("Email %s failed %d times; moved to review queue", gid[:16], attempts)
                    store.add_pending_review(
                        graph_id=gid,
                        job_id="",
                        client_jd_id="",
                        payload_json=json.dumps({"subject": subj, "receivedDateTime": recv, "attempts": attempts}),
                        review_fields="processing_failed_repeatedly",
                    )
                    store.pipeline_mark_pending_review(gid, detail=f"failed_{attempts}_times")
                    total_quarantined += 1

            if advance_watermark:
                if gid and store.pipeline_should_skip(gid, inet_id):
                    current = store.get_watermark()
                    if recv and (not current or recv > current):
                        store.set_watermark(recv)
                else:
                    advance_watermark = False

        # Every run: make sure every requirement clients listed recently exists in the application.
        reconcile_result = None
        if ai_unavailable:
            reconcile_result = {"skipped": "ai_unavailable"}
        elif settings.metaforge_mode == "api" and os.environ.get("MAIL_RECONCILE_ENABLED", "true").lower() != "false":
            try:
                days = max(1, int(os.environ.get("MAIL_RECONCILE_DAYS", "2") or 2))
                rec_start = datetime.now(timezone.utc) - timedelta(days=days)
                cutoff = _parse_to_utc_dt(settings.ingest_start_datetime) if settings.ingest_start_datetime else None
                if cutoff and cutoff > rec_start:
                    rec_start = cutoff
                window = list(
                    iter_historical_messages(
                        token,
                        mailbox,
                        start_iso=rec_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        end_iso=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                        limit=1000,
                    )
                )
                reconcile_result = reconcile(
                    window,
                    settings=settings,
                    store=store,
                    reprocess=lambda raw: process_single_message(
                        raw, token=token, mailbox=mailbox, settings=settings, allocator=allocator, store=store, skip_classifier=False
                    ),
                )
                _LOG.info("Reconcile: %s", reconcile_result)
            except Exception as exc:
                _LOG.error("Reconcile step failed: %s", exc)
                reconcile_result = {"error": str(exc)}

    allocator.close()

    result = {
        "status": "ok",
        "mode": args.mode,
        "totalFetched": total_fetched,
        "totalSynced": total_synced,
        "totalQuarantined": total_quarantined,
        "reconcile": reconcile_result,
        "aiUnavailable": ai_unavailable,
    }
    result["startIso"] = start_iso
    if args.mode == "historical":
        result["endIso"] = end_iso

    print(f"SYNC_RESULT_JSON:{json.dumps(result)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
