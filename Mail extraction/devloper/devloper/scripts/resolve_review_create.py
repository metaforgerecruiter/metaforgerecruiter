"""
Resolve review-queue items a person confirmed as genuinely separate requirements: re-send the
stored payload with allow_lookalike=true so the backend creates it, then remove the review row.

Usage: python scripts/resolve_review_create.py <graph_id> [<graph_id> ...]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for p in [str(ROOT), str(ROOT / "src"), str(ROOT / "src" / "email_extraction")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

from config import Settings
from metaforge_api import send_to_metaforge
from processed_store import ProcessedStore


def main() -> int:
    settings = Settings.from_env()
    with ProcessedStore(settings.processed_db) as store:
        for gid in sys.argv[1:]:
            rows = store._conn.execute(
                "SELECT id, payload_json FROM pending_reviews WHERE graph_id = ? AND review_fields LIKE 'ambiguous_identity%'",
                (gid,),
            ).fetchall()
            for row_id, payload_json in rows:
                payload = json.loads(payload_json)
                payload["allow_lookalike"] = True
                code = send_to_metaforge(payload, settings)
                store._conn.execute("DELETE FROM pending_reviews WHERE id = ?", (row_id,))
                store._conn.commit()
                print(f"created {payload.get('job_title')!r} as {code}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
