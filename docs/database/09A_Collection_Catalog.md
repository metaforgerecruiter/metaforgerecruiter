# MetaForge Recruiter Application V2 — Collection Catalog

**Document ID:** `docs/database/09A_Collection_Catalog.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Master Collection Inventory

The table below catalogs the **23** MongoDB collections implemented in MetaForge Recruiter Application V2.

| # | Collection Name | Domain Module | Category | Primary Identifier | Ownership & Lifecycle | Security Classification | Read/Write Ratio |
|---|---|---|---|---|---|---|---|
| 1 | `users` | Identity & Access | Core | `_id` / `userId` (`USR-XXXX`) | Account Governance / Soft-Delete | High (PII / Credentials) | 90:10 (Read-Heavy) |
| 2 | `roles_permissions` | Governance | Reference | `_id` / `roleCode` | System Config / Immutable Seed | High (Access Control) | 99:1 (Cache-First) |
| 3 | `organizations` | Tenancy | Core | `_id` / `slug` | Org bootstrap | Medium | 95:5 |
| 4 | `teams` | Organization | Core | `_id` / `teamId` (`TM-XXXX`) | Team Governance / Active | Medium | 80:20 |
| 5 | `clients` | Client Management | Core | `_id` / `clientId` (`CLI-XXXX`) | Client Account / Soft-Delete | Medium (Client PII) | 85:15 |
| 6 | `requirements` | Demand Lifecycle | Core / Transactional | `_id` / `reqCode` (`REQ-YYYY-MM-DD-XXX`) | Job Demands / Active to Closed | Medium (B2B Details) | 70:30 |
| 7 | `requirement_histories` | Demand Lifecycle | Historical | `_id` | Audit Snapshot / Append-Only | Low | 95:5 |
| 8 | `candidates` | Talent Pool | Core | `_id` / `candidateId` (`CAND-XXXXX`) | Candidate Bank / Active Pool | High (Full PII / Resume) | 80:20 |
| 9 | `candidate_documents` | Talent Pool | Operational | `_id` | Document Store / Soft-Delete | High (Original Files) | 70:30 |
| 10 | `submissions` | Workflow | Transactional | `_id` / `submissionId` | Recruitment Funnel / Live | High (Candidate-Req link) | 60:40 (Write-Heavy) |
| 11 | `submission_histories` | Workflow | Historical | `_id` | Status Audit / Append-Only | Low | 95:5 |
| 12 | `interviews` | Interview Engine | Transactional | `_id` / `interviewId` (`INT-XXXXX`) | Scheduler / Active Schedule | Medium | 65:35 |
| 13 | `interview_feedbacks` | Interview Engine | Transactional | `_id` | Evaluation Notes / Write-Once | High (Evaluations) | 80:20 |
| 14 | `offers` | Offer & Onboard | Transactional | `_id` / `offerId` (`OFR-XXXXX`) | Offer Lifecycle / Active | High (CTC & Confidential) | 70:30 |
| 15 | `notifications` | Engagement | Operational | `_id` | In-app notices | Medium | 70:30 |
| 16 | `email_templates` | Engagement | Reference | `_id` | Template library | Low | 90:10 |
| 17 | `saved_searches` | Talent Pool | Operational | `_id` | Saved recruiter filters | Low | 80:20 |
| 18 | `candidate_blacklist` | Governance | Operational | `_id` | Do-not-submit list | High | 90:10 |
| 19 | `ai_parsing_jobs` | AI Engine | Operational | `_id` / `jobId` | Resume Extraction / Transient | Low | 50:50 |
| 20 | `ai_match_scores` | AI Engine | AI / Cache | `_id` | JD-Resume Score / Re-computable | Low | 80:20 |
| 21 | `file_metadata` | Storage | Operational | `_id` / `fileId` | Object Storage Metadata | Medium | 85:15 |
| 22 | `activity_logs` | Security | Audit | `_id` | Security Trail / Immutable | High (Immutable Trail) | 99:1 (Write/Append) |
| 23 | `recruiter_analytics` | Reporting | Analytics | `_id` | Daily Aggregations & Screen Time | Low | 90:10 |

---

## 2. Detailed Collection Purpose & Specifications

### 2.1 Core Domain Collections

#### 1. `users`
- **Purpose:** Stores user profiles, hashed passwords, roles (`superadmin`, `admin`, `lead`, `recruiter`, `devteam`, `client`), capability overrides, and team assignments.
- **Key Relationships:** References `teams`, `clients` (for client role users).
- **Key Indexes:** `{ email: 1 }` (Unique), `{ role: 1, active: 1 }`, `{ teamId: 1 }`.

#### 2. `roles_permissions`
- **Purpose:** Centralized RBAC definition mapping permissions (e.g., `req_view_all`, `cand_export`, `sub_move_stage`) to role codes.
- **Key Relationships:** Referenced by `users`.
- **Key Indexes:** `{ roleCode: 1 }` (Unique).

#### 3. `clients`
- **Purpose:** Stores B2B client corporate details, tier level, POC contacts array, SLA terms, delivery gap metrics, and client agreement status.
- **Key Relationships:** One-to-Many with `requirements`.
- **Key Indexes:** `{ clientName: 1 }` (Unique), `{ status: 1 }`.

#### 4. `requirements`
- **Purpose:** Primary job demand collection tracking title, client, priority, status, openings, budget, SLA days, assigned lead, assigned recruiters array, and status history.
- **Key Relationships:** References `clients`, `users` (Lead, Recruiters).
- **Key Indexes:** `{ reqCode: 1 }` (Unique), `{ status: 1, clientId: 1 }`, `{ assignedLeadId: 1 }`, `{ assignedRecruiters: 1 }`.

#### 5. `candidates`
- **Purpose:** Talent repository containing candidate demographics, contact info, total/relevant experience, current/expected CTC, notice period, location, key skills array, resume status, and match score cache.
- **Key Relationships:** References `users` (Sourced by recruiter), `file_metadata` (Resume).
- **Key Indexes:** `{ phone: 1 }` (Unique), `{ email: 1 }` (Unique), `{ skills: 1 }`, `{ totalExperienceYears: 1 }`.

#### 6. `submissions`
- **Purpose:** Core recruitment transaction tracking candidate submission to requirement across multi-tier stages (`Submitted`, `Submitted to Lead`, `Submitted to Client`, `Interview Scheduled`, `Offered`, `Placed`, `Rejected`).
- **Key Relationships:** References `candidates`, `requirements`, `clients`, `users` (Recruiter, Lead).
- **Key Indexes:** `{ candidateId: 1, requirementId: 1 }` (Compound Unique), `{ stage: 1, recruiterId: 1 }`, `{ clientId: 1 }`.

#### 7. `interviews`
- **Purpose:** Interview scheduler supporting L1, L2, Managerial, Client, and Final HR rounds. Stores meeting links, dateTime, mode, stage, status, and reminder state.
- **Key Relationships:** References `submissions`, `candidates`, `requirements`, `users`.
- **Key Indexes:** `{ submissionId: 1, round: 1 }`, `{ dateTime: 1, status: 1 }`, `{ interviewerEmail: 1 }`.

#### 8. `offers`
- **Purpose:** Tracks offer letter creation, offered CTC, joining date, onboarding status (`Joined`, `Not Joined`, `Declined`), and non-joining recruiter notes.
- **Key Relationships:** References `submissions`, `candidates`, `requirements`.
- **Key Indexes:** `{ submissionId: 1 }` (Unique), `{ status: 1, joiningDate: 1 }`.

---

## 3. Supporting & Operational Collections

#### 9. `ai_parsing_jobs`
- **Purpose:** Async queue and processing log for resume and JD parsing via docx/mammoth/AI engines. Stores status (`PENDING`, `COMPLETED`, `FAILED`), raw output JSON, and confidence scores.

#### 10. `ai_match_scores`
- **Purpose:** Persistent cache of AI JD-to-Resume match analysis, including overall match score, missing skills array, experience fit rating, and semantic summary.

#### 11. `file_metadata`
- **Purpose:** Metadata records for uploaded documents (resumes, JDs, offer PDFs). Stores file name, MIME type, size, storage provider (S3 / Local), storage key, and checksum.

#### 12. `activity_logs` & `activity_logs`
- **Purpose:** Immutable audit trails recording user actions, IP addresses, entity mutations, status updates, and security alerts for governance compliance.

#### 13. `recruiter_analytics`
- **Purpose:** Aggregated metrics for recruiter productivity, turn-around times (TAT), daily submissions count, interview conversions, and active screen time.
