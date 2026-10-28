# MetaForge Recruiter Application V2 — Master Database Architecture

**Document ID:** `docs/database/09_Database_Architecture.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  
**Author:** Senior Enterprise Database & Systems Architect  
**Status:** Approved Architecture Specification  

---

## 1. Architectural Overview & Executive Summary

The MetaForge Recruiter Application V2 (MRAP v2) is an enterprise recruitment management platform designed to automate and orchestrate the full recruitment lifecycle—from client job demand ingestion to AI-powered resume matching, multi-tier lead approval, interview tracking, offer release, and onboarding analytics.

This document presents the complete, implementation-ready **MongoDB + Mongoose Database Architecture** derived directly from the frontend screens, component states, business workflows, RBAC governance, and performance reporting specifications of MetaForge Recruiter V2.

### 1.1 Core Architectural Requirements
1. **Frontend Fidelity:** Every page (Requirements, Candidate Repository, Submissions, Interview Tracker, Clients, User Management, Reports, Activity Logs) is 100% supported with zero lost data fields.
2. **6-Role Data Scoping:** Strict database-supported scoping across `superadmin`, `admin`, `lead`, `recruiter`, `devteam`, and `client` roles.
3. **Dual-Audit & Immutable History:** Real-time state updates paired with append-only status transition histories and tamper-evident activity logging.
4. **AI Processing Persistence:** Structured storage for resume extraction, JD parsing, semantic embeddings, and match score confidence without mutating original source files.
5. **High Throughput & TAT Tracking:** Fast indexed access for dashboard aggregations, turn-around time (TAT) tracking from requirement receipt to placement, and cursor-based pagination for large candidate repositories.

---

## 2. High-Level MongoDB Data Layer Architecture

```
                    ┌─────────────────────────────────────────┐
                    │     Frontend UI / SPA (Next.js / React) │
                    └────────────────────┬────────────────────┘
                                         │ REST APIs / JWT
                    ┌────────────────────▼────────────────────┐
                    │    NestJS Backend Controllers & DTOs   │
                    └────────────────────┬────────────────────┘
                                         │ Mongoose Services
 ┌───────────────────────────────────────┴───────────────────────────────────────┐
 │                        MongoDB Database Cluster (MRAP v2)                     │
 ├───────────────────┬───────────────────┬───────────────────┬───────────────────┤
 │ Core Entities     │ Transactions      │ AI & Files        │ Governance & Audit│
 │ ───────────────── │ ───────────────── │ ───────────────── │ ───────────────── │
 │ • users           │ • submissions     │ • ai_parse_jobs   │ • roles_perms     │
 │ • clients         │ • interviews      │ • ai_matches      │ • activity_logs      │
 │ • requirements    │ • offers          │ • file_metadata   │ • activity_logs   │
 │ • candidates      │ • onboarding      │ • candidate_docs  │ • status_histories│
 └───────────────────┴───────────────────┴───────────────────┴───────────────────┘
```

---

## 3. Collection Taxonomy & Categorization

The database schema is partitioned into 8 logical domain modules comprising 18 core collections:

| Module Domain | Collection Name | Purpose | Data Type | Primary Access Pattern |
|---|---|---|---|---|
| **Identity & Access** | `users` | User accounts, credentials, role assignments, team lead links | Core | Read-heavy (Auth / Scoping) |
| | `roles_permissions` | RBAC matrix, capability flags, module access rules | Reference | Read-heavy (Cached) |
| | `teams` | Recruiter-Lead-Admin hierarchical groupings | Core | Read/Write |
| **Client Management** | `clients` | Client accounts, SLA rules, delivery gaps, tier info | Core | Read-heavy |
| **Demand Lifecycle** | `requirements` | Job demands, openings, budgets, status, priority | Core / Transactional | High Write / Aggregation |
| | `requirement_histories` | Reassignments, status changes, revoke requests | Historical | Append-Only |
| **Talent Pool** | `candidates` | Candidate profiles, CTC, notice period, tech stack | Core | High Read / Search |
| | `candidate_documents` | Resumes, certificates, portfolio files metadata | Operational | Read/Write |
| **Submission Workflow**| `submissions` | Candidate-requirement matching, lead review, client forward | Transactional | High Write / Concurrent |
| | `submission_histories` | Stage progression audit (Submitted -> Lead -> Client -> Placed) | Historical | Append-Only |
| **Interview Engine** | `interviews` | Scheduled rounds, modes, Google Meet/Teams links, reminders | Transactional | Write/Poll |
| | `interview_feedbacks` | Evaluator ratings, rejection reasons, round scores | Transactional | Write-once |
| **Offer & Onboarding** | `offers` | Offer letters released, joining status, CTC, counter-offers | Transactional | Write-heavy |
| **System & Intelligence**| `ai_parsing_jobs` | Resume & JD extraction queues, confidence, parser errors | AI | Operational / Transient |
| | `ai_match_scores` | Skill overlap, experience alignment, semantic vector index | AI | Compute Cache |
| | `file_metadata` | Storage keys, S3 URIs, MIME types, checksums | Operational | Read/Write |
| | `activity_logs` | Immutable security activity, IP tracking, admin actions | Audit | Append-Only |
| | `recruiter_analytics` | Daily performance, TAT metrics, screen-time logs | Analytics | Write-heavy / Aggregation |

---

## 4. Collection Boundary & Embedding Decision Matrix

To prevent unbounded document growth while maintaining high read efficiency, the following rules govern document boundaries:

1. **EMBED WHEN:**
   - The child entity is bounded (e.g., maximum 5 phone numbers or 10 key skills).
   - The child entity is ALWAYS retrieved alongside the parent (e.g., Candidate Education or Candidate Skills).
   - Atomic updates to parent + child are strictly required.

2. **REFERENCE WHEN:**
   - High or unbounded cardinality (e.g., Candidates submitted to a Requirement, Activity Logs).
   - The entity is queried independently (e.g., Candidate Repository filtered across multiple requirements).
   - Entity ownership is shared across multiple domains (e.g., Client linked to Requirements and Submissions).

### Summary Boundary Decisions

```
[User Document] ──(Embeds)──> [Permission Overrides, Contact Details, Preferences]
[User Document] ──(References)──> [Team ID, Assigned Lead ID]

[Client Document] ──(Embeds)──> [POC Contacts Array, SLA Terms]
[Client Document] ──(References)──> [Requirements Array (Virtual / FK)]

[Requirement Document] ──(Embeds)──> [Required Skills, Location Array, Salary Range]
[Requirement Document] ──(References)──> [Client ID, Assigned Lead ID, Recruiter IDs]

[Candidate Document] ──(Embeds)──> [Education, Work History, Skill Tags, CTC Breakdown]
[Candidate Document] ──(References)──> [Resume File ID, Primary Recruiter ID]

[Submission Document] ──(Embeds)──> [AI Match Snapshot, Stage Timestamps]
[Submission Document] ──(References)──> [Candidate ID, Requirement ID, Recruiter ID, Lead ID]
```

---

## 5. Multi-Role Data Scoping Architecture

To enforce the 6 system roles seamlessly at the database query level, every primary query filter incorporates mandatory scope identifiers:

```typescript
// NestJS MongoDB Scoping Filter Strategy
export function buildDataScopeFilter(user: CurrentUserPayload): FilterQuery<any> {
  switch (user.role) {
    case 'superadmin':
    case 'admin':
    case 'devteam':
      return {}; // Global access

    case 'lead':
      // Team Leads see their own work + work assigned to recruiters in their team
      return {
        $or: [
          { assignedLeadId: user.userId },
          { recruiterId: { $in: user.teamRecruiterIds } },
          { leadId: user.userId }
        ]
      };

    case 'recruiter':
      // Recruiters see only requirements/candidates/submissions assigned to them
      return {
        $or: [
          { recruiterId: user.userId },
          { assignedRecruiters: user.userId },
          { createdBy: user.userId }
        ]
      };

    case 'client':
      // Clients see only requirements and submissions linked to their client ID
      return {
        clientId: user.clientId
      };

    default:
      throw new UnauthorizedException('Invalid Role Context');
  }
}
```

---

## 6. Target NestJS Directory Module Layout

The backend implementation will structure Mongoose schemas cleanly under NestJS domain feature modules:

```
backend/src/
├── database/
│   ├── database.module.ts
│   ├── mongoose-config.service.ts
│   ├── indexes/
│   ├── seeds/
│   └── migrations/
├── modules/
│   ├── users/
│   │   ├── schemas/user.schema.ts
│   │   └── schemas/role-permission.schema.ts
│   ├── clients/
│   │   └── schemas/client.schema.ts
│   ├── requirements/
│   │   ├── schemas/requirement.schema.ts
│   │   └── schemas/requirement-history.schema.ts
│   ├── candidates/
│   │   ├── schemas/candidate.schema.ts
│   │   └── schemas/candidate-document.schema.ts
│   ├── submissions/
│   │   ├── schemas/submission.schema.ts
│   │   └── schemas/submission-history.schema.ts
│   ├── interviews/
│   │   ├── schemas/interview.schema.ts
│   │   └── schemas/interview-feedback.schema.ts
│   ├── offers/
│   │   └── schemas/offer.schema.ts
│   ├── ai/
│   │   ├── schemas/ai-parse-job.schema.ts
│   │   └── schemas/ai-match-score.schema.ts
│   ├── files/
│   │   └── schemas/file-metadata.schema.ts
│   └── audit/
│       ├── schemas/audit-log.schema.ts
│       └── schemas/activity-log.schema.ts
```
