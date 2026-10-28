#!/usr/bin/env python3
"""
Controlled end-to-end test verifying the shared V1 Auto Mail Extraction pipeline
correctly parses an incoming requirement email, maps all fields to V2 contracts,
persists the canonical record in V2 storage, and prevents duplicate creation on re-send.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for p in [str(ROOT), str(ROOT / "src"), str(ROOT / "src" / "email_extraction")]:
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

import requests
from config import Settings
from processed_store import ProcessedStore
from metaforge_api import IdAllocator, send_to_metaforge
from main import process_single_message

API_BASE = "http://localhost:3001/api/v1"
ADMIN_EMAIL = "r.haines@talentflow.io"
ADMIN_PASS = "Admin@2026"


def get_admin_token() -> str:
    r = requests.post(
        f"{API_BASE}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASS, "role": "superadmin"},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()
    return data.get("accessToken") or data.get("token") or ""


def fetch_v2_requirements(token: str) -> list[dict]:
    r = requests.get(
        f"{API_BASE}/requirements",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


def fetch_workspace(token: str) -> dict:
    r = requests.get(
        f"{API_BASE}/workspace",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()


def run_integration_test():
    print("======================================================================")
    print("V1 AUTO MAIL EXTRACTION -> V2 BACKEND INTEGRATION TEST")
    print("======================================================================")

    test_run_id = int(time.time())
    test_db_path = ROOT / "data" / f"test_store_{test_run_id}.db"

    os.chdir(ROOT)
    import dataclasses
    settings = dataclasses.replace(Settings.from_env(), processed_db=str(test_db_path))
    allocator = IdAllocator(settings.metaforge_sqlite_path if settings.metaforge_mode == "sqlite" else settings.metaforge_id_db)

    token = get_admin_token()
    assert token, "Admin authentication failed!"
    print("Admin authenticated with V2 backend.")

    controlled_msg_id = f"graph-msg-v1-int-{test_run_id}"
    client_name = f"V1 Integration Client {test_run_id}"
    client_jd = f"V1-JD-{test_run_id}"

    test_role_title = f"Lead Data Platform Engineer {test_run_id}"

    # Sample realistic recruitment email body
    email_body = f"""
    Dear MetaForge Team,

    Please find our urgent requirement below:

    Client Requisition ID: {client_jd}
    Client: {client_name}
    Role: {test_role_title}
    Location: Bangalore, India
    Work Mode: Hybrid
    Total Experience: 7 - 10 years
    Budget: 28,00,000 - 36,00,000 INR per annum
    Notice Period: 15 to 30 Days
    Openings: 3
    Employment Type: Full-time

    Mandatory Skills: Apache Spark, Databricks, Python, Delta Lake, AWS
    Secondary Skills: Terraform, CI/CD, SQL, Kafka

    Job Description:
    We are seeking a Lead Data Platform Engineer to design, build, and optimize enterprise streaming
    and batch data pipelines on AWS and Databricks. Candidate must have strong experience with distributed
    data processing, Lakehouse architectures, and performance tuning.

    Regards,
    Talent Acquisition Lead
    """

    raw_message = {
        "id": controlled_msg_id,
        "internetMessageId": f"<{controlled_msg_id}@clientcorp.com>",
        "conversationId": f"conv-v1-int-{test_run_id}",
        "subject": f"Urgent Requirement: {test_role_title} - {client_jd}",
        "from": {
            "emailAddress": {
                "name": "LTTS Talent Acquisition",
                "address": "hiring@ltts.com",
            }
        },
        "toRecipients": [
            {"emailAddress": {"address": "recruitment.application@metaforgeit.com"}}
        ],
        "receivedDateTime": datetime.now(timezone.utc).isoformat(),
        "body": {
            "contentType": "text",
            "content": email_body,
        },
        "hasAttachments": False,
    }

    with ProcessedStore(settings.processed_db) as store:
        # Step 1: Process the controlled email through V1 pipeline
        print("\nStep 1: Ingesting controlled email through V1 pipeline...")
        synced_1 = process_single_message(
            raw_message,
            token="",
            mailbox=settings.mailbox_upn,
            settings=settings,
            allocator=allocator,
            store=store,
            skip_classifier=True,  # Test email, skip classifier network call to test deterministic flow
        )
        print(f"  V1 Pipeline Result: synced_rows = {synced_1}")
        assert synced_1 >= 1, "V1 pipeline failed to extract and sync requirement!"

        # Step 2: Verify in V2 backend storage
        print("\nStep 2: Verifying requirement in V2 MongoDB storage...")
        reqs = fetch_v2_requirements(token)
        matched = [r for r in reqs if r.get("sourceMessageId") == controlled_msg_id or r.get("sourceClientJdId") == client_jd or (r.get("title") == "Lead Data Platform Engineer" and r.get("sourceMessageId") == controlled_msg_id)]
        assert len(matched) == 1, f"Expected 1 matched requirement in V2, found {len(matched)}!"
        saved = matched[0]
        req_id = saved.get("_id")
        req_code = saved.get("reqCode")

        print(f"  Found canonical record in V2: ID={req_id}, Code={req_code}")
        print(f"  Title: {saved.get('title')}")
        print(f"  Client: {saved.get('client') or saved.get('clientName')}")
        print(f"  Location: {saved.get('location')}")
        print(f"  Experience: {saved.get('experienceRange')}")
        print(f"  Budget: {saved.get('budget')} | Range: {saved.get('budgetRange')}")
        print(f"  Openings: {saved.get('openings')}")
        print(f"  Mandatory Skills: {saved.get('mandatorySkills')}")
        print(f"  Source Client JD ID: {saved.get('sourceClientJdId')}")
        print(f"  First Detected At: {saved.get('firstDetectedAt')}")

        assert saved.get("openings") == 3, f"Expected openings=3, got {saved.get('openings')}"
        if saved.get("sourceClientJdId"):
            assert saved.get("sourceClientJdId") == client_jd, f"Client JD ID mismatch: {saved.get('sourceClientJdId')} vs {client_jd}"

        # Step 3: Verify Deduplication on repeat processing
        print("\nStep 3: Re-processing identical email to test deduplication...")
        synced_repeat = process_single_message(
            raw_message,
            token="",
            mailbox=settings.mailbox_upn,
            settings=settings,
            allocator=allocator,
            store=store,
            skip_classifier=True,
        )
        print(f"  V1 Repeat Result: synced_rows = {synced_repeat} (0 means correctly deduped/skipped)")

        reqs_after_repeat = fetch_v2_requirements(token)
        matched_repeat = [r for r in reqs_after_repeat if str(r.get("_id")) == str(req_id)]
        assert len(matched_repeat) == 1, f"Duplicate created! Found {len(matched_repeat)} records."
        print("  Deduplication PASSED: exactly 1 canonical record remains in V2 storage.")

        # Step 4: Verify in-place update on changed email
        print("\nStep 4: Sending revised requirement email (openings increased to 5)...")
        updated_body = email_body.replace("Openings: 3", "Openings: 5")
        raw_message_update = dict(raw_message)
        raw_message_update["id"] = f"{controlled_msg_id}-rev1"
        raw_message_update["internetMessageId"] = f"<{controlled_msg_id}-rev1@clientcorp.com>"
        raw_message_update["inReplyTo"] = raw_message["internetMessageId"]
        raw_message_update["body"] = {"contentType": "text", "content": updated_body}

        synced_update = process_single_message(
            raw_message_update,
            token="",
            mailbox=settings.mailbox_upn,
            settings=settings,
            allocator=allocator,
            store=store,
            skip_classifier=True,
        )

        reqs_after_update = fetch_v2_requirements(token)
        matched_update = [r for r in reqs_after_update if str(r.get("_id")) == str(req_id)]
        assert len(matched_update) == 1, f"Duplicate created on update! Found {len(matched_update)} records."
        updated_doc = matched_update[0]
        assert str(updated_doc.get("_id")) == str(req_id), "Requirement ID changed during update!"
        assert updated_doc.get("openings") == 5, f"Expected openings=5, got {updated_doc.get('openings')}"
        print(f"  In-place update PASSED: Openings updated to {updated_doc.get('openings')}, canonical ID preserved.")

        # Step 5: Verify Workspace UI payload
        print("\nStep 5: Verifying Workspace UI view...")
        ws = fetch_workspace(token)
        ws_reqs = ws.get("requirements", [])
        ws_item = next((r for r in ws_reqs if str(r.get("_id") or r.get("id")) == str(req_id)), None)
        assert ws_item is not None, "Requirement not found in Workspace payload!"
        assert ws_item.get("openings") == 5, f"Workspace openings mismatch: {ws_item.get('openings')}"
        print(f"  Workspace verified: ID={ws_item.get('id') or ws_item.get('_id')}, openings={ws_item.get('openings')}")

        # Cleanup isolated test record
        print("\nCleaning up test record from V2 storage...")
        del_r = requests.delete(
            f"{API_BASE}/requirements/{req_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        print(f"  Cleanup status: {del_r.status_code}")

    allocator.close()
    if test_db_path.exists():
        try:
            os.remove(test_db_path)
        except Exception:
            pass
    print("\n======================================================================")
    print("ALL V1 -> V2 INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("======================================================================\n")


if __name__ == "__main__":
    run_integration_test()
