"""
Forget everything the pipeline recorded for specific Graph messages so they can be
re-extracted (e.g. after a parser fix). Backs up the store first.

Usage:
  python scripts/reset_messages_state.py --since 2026-10-15T06:55:00 GRAPH_ID [GRAPH_ID ...]

--since also clears rows that carry no message id (identities, client requirements,
JD versions, status history) created at or after that UTC timestamp.
"""

from __future__ import annotations

import argparse
import shutil
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for p in [str(ROOT), str(ROOT / "src"), str(ROOT / "src" / "email_extraction")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from config import Settings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("graph_ids", nargs="*")
    parser.add_argument("--since", required=True, help="UTC ISO timestamp")
    parser.add_argument(
        "--received-since",
        help="also reset every message whose receivedDateTime >= this UTC ISO timestamp (from the disposition ledger)",
    )
    args = parser.parse_args()

    db_path = (ROOT / Settings.from_env().processed_db).resolve()
    if args.received_since:
        with sqlite3.connect(db_path) as c:
            rows = c.execute(
                "SELECT DISTINCT graph_id FROM email_dispositions WHERE received_date_time >= ?",
                (args.received_since,),
            ).fetchall()
        args.graph_ids = sorted(set(args.graph_ids) | {r[0] for r in rows if r[0]})
        print(f"messages received since {args.received_since}: {len(args.graph_ids)}")
    if not args.graph_ids:
        print("nothing to reset")
        return 0
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = db_path.with_name(f"{db_path.stem}.backup-{stamp}{db_path.suffix}")
    shutil.copy2(db_path, backup)
    print(f"backup: {backup}")

    ids = list(args.graph_ids)
    marks = ",".join("?" * len(ids))
    since = args.since
    conn = sqlite3.connect(db_path)
    statements = [
        (f"DELETE FROM pipeline_state WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM processed WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM seen_messages WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM email_dispositions WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM requirement_fingerprints WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM duplicate_decisions WHERE source_email_id IN ({marks})", ids),
        (f"DELETE FROM pending_reviews WHERE graph_id IN ({marks})", ids),
        (f"DELETE FROM requirement_memory WHERE source_graph_id IN ({marks})", ids),
        (f"DELETE FROM requirement_identity WHERE last_graph_id IN ({marks}) OR first_seen >= ?", ids + [since]),
        ("DELETE FROM jd_versions WHERE created_at >= ?", [since]),
        ("DELETE FROM status_history WHERE changed_at >= ?", [since]),
        ("DELETE FROM client_requirements WHERE created_at >= ?", [since]),
    ]
    for sql, params in statements:
        cur = conn.execute(sql, params)
        print(f"{cur.rowcount:4d}  {sql.split(' WHERE')[0]}")
    conn.commit()
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
