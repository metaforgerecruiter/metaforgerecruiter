# MetaForge Recruiter Application V2 — Backend & Mongoose Implementation Roadmap

**Document ID:** `docs/database/10_Implementation_Roadmap.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+) + Redis (v7+)  
**Status:** Approved Implementation Execution Plan  

---

## 1. Implementation Philosophy & Core Guidelines

When translating the approved database architecture into NestJS + Mongoose code, execution follows a strict **Application-Driven Incremental Rule**:

> **GOLDEN RULE FOR CURSOR / BACKEND IMPLEMENTATION:**  
> Do NOT blindly implement every theoretical database feature at once.  
> First inspect the existing frontend screens, workflows, RBAC governance, and architecture docs. Then implement schemas, indexes, and queries **based strictly on actual UI data requirements and query patterns justified by the application.**

---

## 2. Phased Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: DATABASE FOUNDATION                         │
│  MongoDB Connection • Mongoose Setup • Core Schemas • Enums • Validation│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    PHASE 2: DATA INTEGRITY                              │
│  Unique Constraints • Compound Indexes • History Tracking • Transactions│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                PHASE 3: APPLICATION DATA ACCESS                         │
│  Repositories • Query Building • Filtering • Pagination • RBAC Scoping  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                    PHASE 4: SUPPORTING DATA                             │
│  AI Parsing Engine • File Metadata • Audit Logs • Notifications         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│            PHASE 5: PERFORMANCE & INFRASTRUCTURE                        │
│  Redis Caching • BullMQ Async Queues • Health Checks • Deployment       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Phase Execution Breakdown

---

### Phase 1 — Database Foundation
**Goal:** Establish NestJS Mongoose connection module, define base schemas, TypeScript interfaces, enums, soft delete flags, and embedded sub-document structures.

#### Deliverables & Tasks:
1. **NestJS Database Module (`backend/src/database/`):**
   - Configure `MongooseModule.forRootAsync()` with connection pooling, retries, and URI configuration.
   - Setup global Mongoose schema options (`timestamps: true`, `toJSON` transforms).
2. **Domain Schemas (`backend/src/modules/*/schemas/`):**
   - `UserSchema` (`users` collection) with `Role` enums and capability sub-documents.
   - `RolePermissionSchema` (`roles_permissions` collection) with permission matrix array.
   - `TeamSchema` (`teams` collection) with recruiter and lead linkages.
   - `ClientSchema` (`clients` collection) with embedded `pocContacts` array and SLA terms.
   - `RequirementSchema` (`requirements` collection) with priority, budget range, and skills required.
   - `CandidateSchema` (`candidates` collection) with experience, CTC, notice period, and skill tags.
   - `SubmissionSchema` (`submissions` collection) with stage enums and match score fields.
   - `InterviewSchema` (`interviews` collection) with meeting links, rounds, and schedules.
   - `OfferSchema` (`offers` collection) with offered CTC, joining dates, and outcome status.

---

### Phase 2 — Data Integrity & Constraints
**Goal:** Enforce data safety, prevent duplicates, establish index coverage, track state transition history, and define transaction boundaries.

#### Deliverables & Tasks:
1. **Unique Constraints & Duplicate Guards:**
   - Single Unique Index on `users.email`, `users.userId`, `clients.clientName`, `requirements.reqCode`, `candidates.email`, `candidates.phone`.
   - Compound Unique Index on `submissions` (`{ candidateId: 1, requirementId: 1 }`) to prevent duplicate submissions.
2. **Performance Compound Indexes:**
   - `requirements`: `{ status: 1, clientId: 1, createdAt: -1 }` (ESR compliance for UI filter).
   - `candidates`: `{ skills: 1, totalExperienceYears: 1 }` (Multikey index for talent search).
   - `submissions`: `{ recruiterId: 1, stage: 1, submittedAt: -1 }` (Recruiter workspace view).
   - `interviews`: `{ dateTime: 1, status: 1 }` (Scheduler calendar queries).
3. **History & Turnaround Time (TAT) Tracking:**
   - `RequirementHistorySchema` and `SubmissionHistorySchema` for append-only state tracking.
   - Milestone timestamp fields (`emailArrivedTime`, `submittedAt`, `leadApprovedAt`, `clientForwardedAt`, `joiningDate`) for TAT aggregation.
4. **MongoDB Transaction Boundaries:**
   - Wrap candidate submission creation + history logging + duplicate check in MongoDB session transactions (`session.withTransaction()`).

---

### Phase 3 — Application Data Access & Scoping
**Goal:** Build NestJS Repositories, query builders, sorting/filtering handlers, cursor & offset pagination helpers, and Mongoose RBAC Data Scoping plugins.

#### Deliverables & Tasks:
1. **Repository Pattern Implementation:**
   - Base Generic Repository (`BaseRepository<T>`) providing `find()`, `findById()`, `create()`, `update()`, `softDelete()`.
   - Feature Repositories (`RequirementRepository`, `SubmissionRepository`, `CandidateRepository`).
2. **Mongoose Scoping Plugin (`DataScopePlugin`):**
   - Middleware hook automatically appending user scope rules (`lead` -> team IDs, `recruiter` -> self ID, `client` -> client ID).
3. **Pagination & Search Execution:**
   - Cursor-based pagination utility for `candidates` and `activity_logs`.
   - Offset-based pagination utility for `requirements` and `submissions` data tables.
   - `$text` full-text search pipeline for resume keyword searches.

---

### Phase 4 — Supporting Data & AI Services
**Goal:** Implement file metadata storage, async AI parsing queues, audit logging, and master seed reference scripts.

#### Deliverables & Tasks:
1. **File Management Layer (`backend/src/modules/files/`):**
   - `FileMetadataSchema` tracking S3 storage keys, checksums, MIME types, and virus scan status.
   - S3 Storage Provider Service generating presigned upload/download URLs.
2. **AI Processing Engine Integration (`backend/src/modules/ai/`):**
   - `AIParsingJobSchema` and `AIMatchScoreSchema`.
   - Non-overwrite safeguard logic keeping AI extracted snapshots separate from editable candidate profiles.
3. **Immutable Audit Logging (`backend/src/modules/audit/`):**
   - `ActivityLogSchema` with TTL index for auto-expiring logs after 3 years.
   - Audit Interceptor capturing NestJS controller actions, user email, IP address, and payload diffs.
4. **Seed Reference Scripts (`backend/src/database/seeds/`):**
   - Seed scripts for demo users (`r.haines@talentflow.io`, `m.chen@talentflow.io`, etc.) with Argon2id hashed passwords.
   - RBAC matrix seed populating default capability permissions.

---

### Phase 5 — Performance & Infrastructure
**Goal:** Add Redis caching, BullMQ background queues, containerization, security hardening, and deployment pipelines.

#### Deliverables & Tasks:
1. **Redis Caching Layer:**
   - Cache `roles_permissions` and reference data in Redis to prevent repeated DB reads.
   - Cache heavy aggregate dashboards (Recruiter performance KPIs) with 5-minute TTL invalidation.
2. **BullMQ Worker Queues:**
   - Asynchronous BullMQ background queue for resume parsing, email reminders, and AI match score re-computations.
3. **Deployment & Containerization:**
   - Production Dockerfile for NestJS API.
   - Docker Compose configuration combining NestJS API, MongoDB Replica Set, Redis, and MinIO object storage.

---

## 4. Summary Matrix of Implementation Modules

| Phase | Core Focus Area | Primary Tech Components | Target Code Location |
|---|---|---|---|
| **Phase 1** | Foundation | NestJS Module, Mongoose Schemas, DTOs, Enums | `backend/src/database/`, `src/modules/*/schemas/` |
| **Phase 2** | Integrity | Indexes, Unique Guards, History Schemas, Transactions | `backend/src/database/indexes/`, `src/database/migrations/` |
| **Phase 3** | Data Access | Repositories, Query Scoping Plugin, Pagination | `backend/src/modules/*/repositories/`, `src/common/` |
| **Phase 4** | Supporting | AI Schemas, File Metadata, S3 Adapter, Audit Trail | `backend/src/modules/ai/`, `files/`, `audit/` |
| **Phase 5** | Infra & Perf | Redis Cache, BullMQ Queues, Docker Compose | `backend/src/common/cache/`, `docker-compose.yml` |
