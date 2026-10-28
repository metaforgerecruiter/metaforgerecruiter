"""
Mailbox -> application reconciliation (runs after every sync).

Every requirement ID a client lists in the new text of an email must exist in the application.
For each ID that does not:
  1. the email is re-processed once automatically (its pipeline state is cleared first);
  2. if the ID is still missing, the email goes to the review queue as "listed_but_missing"
     and an error is logged, so a missed requirement is never silent.

IDs in status instructions ("its cancelled", "put on hold") are not expected to exist, and IDs
a user deliberately deleted in the application are respected.
"""

from __future__ import annotations

import json
import logging
import os
import re
from datetime import datetime, timezone
from typing import Any, Callable, Iterable

import requests

from body_normalizer import html_to_plain
from email_filter import is_internal_address, is_sender_allowlisted
from requirement_identity import clean_client_jd_id
from status_tracker import detect_status_keyword
from thread_splitter import split_thread

_LOG = logging.getLogger(__name__)

# A requirement row: client ID followed by table cells, or an explicit "Req ID: <id>" label.
_ROW_ID = re.compile(r"(?m)^[^\n|]*?\b(\d{5,7}-\d{1,2})\b\s*\|[^\n]*\|")
_LABEL_ID = re.compile(r"(?im)\b(?:req(?:uest)?|demand|so)\s*[-_ ]?id\s*[:#|][:#|\s]*(\d{5,7}-\d{1,2})\b")


def listed_ids(raw: dict[str, Any]) -> list[str]:
    """Client requirement IDs that this email asks to exist (empty for internal/status-only mail)."""
    fe = str(((raw.get("from") or {}).get("emailAddress") or {}).get("address") or "")
    if not fe or is_internal_address(fe) or not is_sender_allowlisted(fe):
        return []
    subject = str(raw.get("subject") or "")
    body = (raw.get("body") or {}).get("content") or ""
    plain = html_to_plain(body) if "html" in str((raw.get("body") or {}).get("contentType") or "").lower() else body
    thread = split_thread(plain, subject)
    text = thread.new_text if thread.has_quote else plain
    if thread.has_quote and detect_status_keyword(subject, text):
        return []  # status instruction for existing rows, never a creation
    ids = {m.group(1) for m in _ROW_ID.finditer(text)} | {m.group(1) for m in _LABEL_ID.finditer(text)}
    return sorted(i for i in ids if clean_client_jd_id(i))


def _presence_url(settings: Any) -> str:
    base = str(getattr(settings, "metaforge_api_url", "") or "").rstrip("/")
    endpoint = str(getattr(settings, "metaforge_requirements_endpoint", "") or "api/v1/requirements/ingest-email").strip("/")
    return f"{base}/{endpoint.rsplit('/', 1)[0]}/presence"


def check_presence(ids: Iterable[str], settings: Any) -> dict[str, list[str]]:
    key = os.environ.get("METAFORGE_API_KEY", "").strip()
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
        headers["x-internal-api-key"] = key
    r = requests.post(_presence_url(settings), json={"clientJdIds": sorted(set(ids))}, headers=headers, timeout=60)
    r.raise_for_status()
    data = (r.json() or {}).get("data") or {}
    return {k: list(data.get(k) or []) for k in ("live", "deleted", "missing")}


def _attempts(store: Any, graph_id: str, bump: bool = False) -> int:
    store._conn.execute(
        "CREATE TABLE IF NOT EXISTS reconcile_attempts (graph_id TEXT PRIMARY KEY, attempts INTEGER NOT NULL, updated_at TEXT)"
    )
    if bump:
        store._conn.execute(
            """INSERT INTO reconcile_attempts (graph_id, attempts, updated_at) VALUES (?, 1, ?)
               ON CONFLICT(graph_id) DO UPDATE SET attempts = attempts + 1, updated_at = excluded.updated_at""",
            (graph_id, datetime.now(timezone.utc).isoformat()),
        )
        store._conn.commit()
    row = store._conn.execute("SELECT attempts FROM reconcile_attempts WHERE graph_id = ?", (graph_id,)).fetchone()
    return int(row[0]) if row else 0


def _forget_message(store: Any, graph_id: str, inet_id: str = "") -> None:
    """Clear what the pipeline remembers about one email so it is processed again from scratch."""
    for sql in (
        "DELETE FROM pipeline_state WHERE graph_id = ?",
        "DELETE FROM processed WHERE graph_id = ?",
        "DELETE FROM seen_messages WHERE graph_id = ?",
        "DELETE FROM email_dispositions WHERE graph_id = ?",
        "DELETE FROM requirement_fingerprints WHERE graph_id = ?",
        "DELETE FROM duplicate_decisions WHERE source_email_id = ?",
    ):
        store._conn.execute(sql, (graph_id,))
    if inet_id:
        store._conn.execute("DELETE FROM seen_messages WHERE internet_message_id = ?", (inet_id,))
    store._conn.commit()


def reconcile(
    messages: Iterable[dict[str, Any]],
    *,
    settings: Any,
    store: Any,
    reprocess: Callable[[dict[str, Any]], Any],
    max_attempts: int = 1,
) -> dict[str, Any]:
    by_id: dict[str, dict[str, Any]] = {}
    for raw in messages:
        for rid in listed_ids(raw):
            by_id[rid] = raw  # latest email listing the ID (messages arrive oldest first)
    result: dict[str, Any] = {"checked": len(by_id), "missing": [], "recovered": [], "stillMissing": []}
    if not by_id:
        return result

    missing = check_presence(by_id, settings)["missing"]
    result["missing"] = missing
    if not missing:
        return result

    emails: dict[str, dict[str, Any]] = {}
    for rid in missing:
        emails.setdefault(str(by_id[rid].get("id")), by_id[rid])
    for gid, raw in emails.items():
        if _attempts(store, gid) >= max_attempts:
            continue
        _attempts(store, gid, bump=True)
        _LOG.warning("Reconcile: re-processing %s because listed IDs are missing", gid[:16])
        _forget_message(store, gid, str(raw.get("internetMessageId") or ""))
        try:
            reprocess(raw)
        except Exception as exc:  # the review entry below keeps the miss visible
            _LOG.warning("Reconcile re-process of %s failed: %s", gid[:16], exc)

    still = check_presence(missing, settings)["missing"]
    result["recovered"] = sorted(set(missing) - set(still))
    result["stillMissing"] = still
    for rid in still:
        raw = by_id[rid]
        gid = str(raw.get("id"))
        exists = store._conn.execute(
            "SELECT 1 FROM pending_reviews WHERE graph_id = ? AND review_fields = 'listed_but_missing' AND client_jd_id LIKE ?",
            (gid, f"%{rid}%"),
        ).fetchone()
        if not exists:
            store.add_pending_review(
                graph_id=gid,
                job_id="",
                client_jd_id=rid,
                payload_json=json.dumps({"subject": raw.get("subject"), "receivedDateTime": raw.get("receivedDateTime"), "id": rid}),
                review_fields="listed_but_missing",
            )
        _LOG.error("Reconcile: requirement %s listed in %r is still not in the application", rid, raw.get("subject"))
    return result
