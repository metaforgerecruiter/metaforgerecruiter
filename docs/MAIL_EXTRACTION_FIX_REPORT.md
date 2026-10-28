# Auto Mail Extraction — Dedup, Filtering, Status, IDs and Ordering Fix Report

Date: 2026-10-15 · Scope: `Mail extraction/devloper/devloper` (Python pipeline), `backend` (NestJS), `frontend` (Next.js)

## 1. Root causes

| # | Problem | Root cause (file → function) |
|---|---------|------------------------------|
| 1 | Internal mail created requirements | `email_filter.validate_email_access`, `main.extract_and_map`, `intake_gates.should_block_internal_sender` / `apply_intake_gates` all had a hard-coded "CEO exception" allowing `rkarnam@metaforgeit.com` to create requirements. 49 internal/synthetic records exist in production from earlier ingestion. |
| 2 | Replies/forwards re-applied quoted history | `body_normalizer.strip_signature_heuristic` **discarded the sender's new text** whenever it was < 400 chars and kept the quoted thread instead. Client replies such as "211924-1 … Hold" or "Pls stop on this demand" were parsed from the quoted 46-row table / old JD, re-applying stale data and creating duplicates (e.g. ITC "SAP IBP" rows from meeting-invite replies). |
| 3 | Stop/hold replies never reached the app | `status_tracker.evaluate_status_short_circuit` only updated the pipeline's local SQLite store (`update_requirement_status`); nothing was sent to the backend. |
| 4 | Distinct requirements merged | `requirements.service.findMailRequirement` Tier 4 merged records with a similar title + ≥60 % skill overlap even when the source emails (subjects) differed — e.g. "Application Engineer – US" and "– UK" were merged into `2026/10/10-004`, a record originally created from "Senior Analyst – SAP S/4 HANA EAM". |
| 5 | Requirement ID changed on update / wrong format | `requirements.service.applyRequirementDeltaUpdate` appended `(clientId)` to `reqCode` on updates; `generateReqCode` produced `YYYY/MM/DD-NNN (clientId)`; `sanitizeRequirement`, `workspace.mapper.mapRequirement` and `RequirementsTable.tsx` rewrote the stored ID for display. |
| 6 | Requirement IDs reused / collided | `generateReqCode` used `find()` without `includeDeleted`, so the data-scope plugin hid deleted rows and their numbers were reused (`2026/10/14-012` existed twice → E11000 500 errors). No retry on concurrent allocation. |
| 7 | Inconsistent ordering | Backend sorted by `firstDetectedAt` but 565 rows had none; `workspace.service` sorted by `emailArrivedTime`; frontend `compareRequirementsDescending` sorted by parsing the Requirement ID string. |
| 8 | Scheduler could stall / overlap | `sync_to_backend.py` counted already-seen mail toward `--limit` (and earlier read the oldest inbox mail); a permanently failing email blocked the watermark forever; no cross-instance lock; historical fetch omitted `conversationId`, disabling thread matching. |
| 9 | Title invented from subject | `ingestFromEmail` fell back to the email subject as job title (record "Re: Accenture Open demands…"). |

## 2. Files changed

**Python pipeline**
- `src/email_extraction/thread_splitter.py` (new): splits a body into the sender's new text and quoted history (Outlook/Gmail header blocks, verified by a following `Sent:/To:/Date:` line); `header_row_for` borrows only the column-name row from a quoted table.
- `main.py`: internal-sender quarantine; extraction scope = new text only for replies (client forwards of the same client's message allowed); status replies pushed to the backend; unmatched status → review queue; `NeedsReview` handling; `source_sender_email` on every payload; ledger disposition `reply_no_change`.
- `src/email_extraction/email_filter.py`: removed CEO exception; `is_internal_address`, `is_trusted_client_domain` (subdomains), `is_reply_with_new_requirement_content`.
- `src/email_extraction/intake_gates.py`: removed CEO exception.
- `src/email_extraction/metaforge_api.py`: `send_status_update` (status-only API call), `NeedsReview`.
- `src/email_extraction/outlook_graph.py`, `scripts/sync_to_backend.py`: fetch `sender` and `conversationId`; limit counts only new mail; failure counter + quarantine after `MAIL_EXTRACTION_MAX_ATTEMPTS` (3); `totalQuarantined`.
- `src/email_extraction/requirement_parser.py`, `field_mapper.py`, `two_way_verifier.py`, `models.py` (earlier today): column mapping by header, RTO→On-site, lakh rounding, no label-as-value capture.
- `tests/test_mail_rules.py` (new): 15 pipeline regression tests.

**Backend**
- `modules/requirements/requirements.service.ts`: `generateReqCode` → `YYYY-MM-DD-NNN` (IST day, includes deleted rows); `saveNewRequirement` (gap-free, retries on unique-index clash); no `reqCode` mutation on update; internal-sender rejection; `applyEmailStatusUpdate` (status-only, never creates/revives); ambiguous look-alikes → `needsReview`; no subject-as-title; sort `firstDetectedAt desc, _id desc`; Mongo lease lock `job_locks/mail-extraction`; replayed email never revives a user-deleted requirement.
- `modules/workspace/workspace.service.ts`, `workspace.mapper.ts`: same ordering; ID returned as stored.
- `test/regression/requirements.regression.js` (new): 19 API/DB regression tests on an isolated `_test` database.
- `test/backfill_first_detected_at.js`, `test/audit_requirement_integrity.js`, `test/fix_*.js`: data scripts (backup first).

**Frontend**
- `components/pages/requirements/useRequirementsPageHandlers3.ts`: default order by original creation time, `_id` tiebreak.
- `components/pages/requirements/RequirementsTable.tsx`: shows the stored Requirement ID; client reference as a separate label; removed hard-coded `2026/10/14` "NEW" hack.
- `useRequirementsPageHandlers1.ts` (earlier today): refresh after background syncs.

## 3. Email filtering and client-update rules
1. Sender = provider metadata (`from` and `sender`), never body text or display name.
2. Any `@metaforgeit.com` (or subdomain) sender: never creates or updates. If it carries requirement data (IDs, ≥2 JD fields, attachment, or a status instruction) it is queued in `pending_reviews` (`internal_sender_needs_review`); otherwise filtered.
3. Client senders: trusted client domains (exact or subdomain). Internal people on To/Cc do not affect acceptance.
4. Replies/forwards: only the sender's new text (plus attachments) may produce requirements, and only if it contains client requirement IDs, ≥2 JD fields or an attachment. A forward (`FW:`) of a message whose quoted sender is the **same client** may use that forwarded message. Quoted history never creates or updates records (a borrowed table header provides column names only).
5. Status instructions (hold / stop sourcing / reopen / resume / close) in the new text update the existing record via a status-only API call; if no single existing record matches, the email is queued for review.
6. Unverifiable or ambiguous items are queued, never silently dropped (`internal_sender_needs_review`, `status_update_unmatched`, `ambiguous_identity`, `processing_failed_repeatedly`).

## 4. Requirement ID generation
- Format `YYYY-MM-DD-NNN`; day = original creation date in Asia/Kolkata (`REQUIREMENT_ID_TIMEZONE`); NNN restarts at 001 daily.
- Next number = max existing number for that day (live **and** deleted, legacy formats included) + 1; taken only when the insert succeeds (gap-free).
- Uniqueness: unique index `(orgId, reqCode, deletedAt)`; concurrent clashes retry with the next number (tested with 10 parallel inserts).
- Client reference stored in `sourceClientJdId` (unique per client among live rows via the existing partial unique index); never merged into the ID.
- Updates, replies, retries, holds, reopens and stop-sourcing never touch `reqCode`.
- Existing 659 legacy IDs (`YYYY/MM/DD-NNN`, 70 with `(clientId)` suffix) were **not** renamed.

## 5. Duplicate detection and in-place updates
Matching order: idempotency key → client requirement ID (same client) → same source message → same thread (title + location compatible) → same client + same title + same source subject. Different subjects with strong similarity → `needsReview` (no create, no merge). Updates change only fields present in the verified source; blank fields never erase stored values; changes are written to `requirement_histories`.

## 6. Ordering
Sort key everywhere: `firstDetectedAt` desc, then `_id` desc (DB query in `findAll`, `/workspace`, frontend comparator, client-side pagination). Updates never change `firstDetectedAt`, `emailArrivedTime` or `reqCode`. 567 legacy rows lacking `firstDetectedAt` were filled from their own `emailArrivedTime`/`createdAt` (backup: `backups/first_detected_at_backfill_*.json`). Verified by regression test 17 (DB = API = workspace = frontend comparator, pagination consistent).

## 7. API and scheduler verification (live)
- Backend restarted 14:04; startup 2-day backfill: 62 emails examined, 0 created (idempotent re-poll).
- Scheduled run 14:06: 2 emails examined, 0 created, 0 changed; lease acquired and released (`job_locks` empty afterwards).
- Ingest auth: wrong key → 401; synthetic payload → ignored.
- Dry run of the new pipeline over the real last-2-days mailbox (temp store, backend calls captured, nothing written): Accenture replies → one Hold update each; "Adding New Req ID 213015-1" → created; LTTS "Pls stop on this demand" ×2 → status-only update; LTTS/ITC chatter and call invites → no change; all internal mail and bounces → blocked.

## 8. Regression results
- Backend (`node test/regression/requirements.regression.js`, isolated DB `metaforge_recruiter_v2_test`, port 3101): **19/19 passed** (tests 1–17, 19 + 11b).
- Pipeline (`.venv\Scripts\python.exe -m unittest discover -s tests`): **15/15 passed** (tests 5, 6, 9, 15, 18 + reply/status/ambiguity/splitter cases). Expected error logs come from the deliberate failure-injection test.
- Type checks: backend and frontend `tsc --noEmit` clean.
- Warnings: pydantic serializer warnings (pre-existing, `field_extraction_method` enum); `next start` warns about `output: standalone` (pre-existing).

## 9. Remaining risks / needs controlled production verification
1. **Existing bad data not changed** (needs a decision): 49 internal/synthetic records; `2026/10/10-004` wrongly overwritten to "Application Engineer" (US/UK roles missing as separate records); possibly stale statuses applied by the old quoted-history parsing. Run `node test/audit_requirement_integrity.js` for the list.
2. **Internal forwards of genuine client mail** now always go to review (no automatic verification against the client's original message yet). If the business relied on the CEO forwarding demands, those now need a manual step.
3. **Legacy IDs** keep their old format; the list mixes `YYYY/MM/DD-NNN` and `YYYY-MM-DD-NNN`. Renaming would change IDs people may already use — not done.
4. Requirements extracted by the LLM (no client ID) still depend on title/subject identity; ambiguous ones go to `pending_reviews`, which currently has no UI.
5. Reply-thread splitting relies on standard Outlook/Gmail header blocks; unusual clients may need new patterns.
6. Status-only updates for threads created before `conversationId` was stored rely on the exact source subject; otherwise they are queued for review.
7. Not yet observed live: a real hold/stop/reopen email, a real internal forward, and a real ambiguous look-alike arriving through the 2-minute scheduler.
