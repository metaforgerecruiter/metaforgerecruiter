# MetaForge Recruiter Application V2 — Business Requirement Traceability

**Document ID:** `docs/database/09N_Requirement_Database_Traceability.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Business Requirement Traceability Catalog

This document validates that every high-level business workflow requirement (from requirement creation to recruiter TAT analytics) is backed by appropriate database collections, relationships, validation constraints, and history tracking mechanisms.

| Business Requirement ID | Functional Requirement Description | Supporting Collection(s) | Relationships & Validation | History & Audit Strategy | Reporting Metric Supported |
|---|---|---|---|---|---|
| **BRD-REQ-001** | Multi-channel job demand ingestion & SLA assignment | `requirements`, `clients` | Many-to-One with `clients`. Validates budget & SLA ranges. | `requirement_histories` tracks demand creation & lead assignment. | Total Open Requirements, Aging Demands. |
| **BRD-REQ-002** | Demand revocation request with mandatory reason | `requirements` | Embedded `revokeReason` & `revokeRequestedBy`. | Logged in `activity_logs` under 'Requirements' category. | Revoke Request Rate, Client Cancellation Ratio. |
| **BRD-CAND-001** | Resume parsing & duplicate candidate detection | `candidates`, `ai_parsing_jobs`, `file_metadata` | Strict compound unique index on `phone` and `email`. | Async job status tracked in `ai_parsing_jobs`. | Resume Processing Throughput & Error Rate. |
| **BRD-SUB-001** | Recruiter candidate submission & AI match score calculation | `submissions`, `ai_match_scores` | Compound unique index `{ candidateId, requirementId }`. | State changes append to `submission_histories`. | Recruiter Submissions Count, Average Match Score. |
| **BRD-SUB-002** | Lead approval gate before client forwarding | `submissions` | Enforces `leadApprovalStatus` gate (`Pending` -> `Approved` / `Rejected`). | Recorded in `submission_histories` with Lead ID & timestamp. | Lead Approval TAT, Lead Rejection Rate. |
| **BRD-INT-001** | Multi-round interview scheduling with Google Meet/Teams links | `interviews`, `submissions` | Ensures valid round sequence (`L1` -> `L2` -> `HR`). | Scheduled time & evaluator notes stored in `interview_feedbacks`. | Interview Conducted Rate, Pass/Fail Ratio. |
| **BRD-OFF-001** | Offer letter release, joining tracking, & non-joining reason capture | `offers`, `submissions`, `candidates` | One-to-One with `submissions`. Stores offered CTC & joining date. | Tracks `Backed Out` / `Declined` status with recruiter notes. | Offer Acceptance Rate, Candidate Backout Ratio. |
| **BRD-AUD-001** | Immutable security audit logging for user activity & compliance | `activity_logs`, `activity_logs` | Append-only document model with 3-year TTL data retention. | Immutable trail recording IP, timestamp, user email, and action. | Security Alerts, System Activity Audit. |
