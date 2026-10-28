# MetaForge Recruiter Application V2 — Comprehensive Index Strategy

**Document ID:** `docs/database/09D_Index_Strategy.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Index Strategy Overview

The indexing strategy for MetaForge Recruiter V2 is derived strictly from the UI search patterns, data table filter options, dashboard metric aggregations, and multi-role scoping requirements.

### Key Indexing Goals
1. **Zero Full-Collection Scans (`COLLSCAN`):** Every UI filter and tabular view is covered by compound indexes (`IXSCAN`).
2. **ESR Rule Compliance:** Indexes follow the **Equality -> Sort -> Range** principle.
3. **Covered Queries:** Dashboard KPI aggregations utilize covered indexes wherever possible.
4. **Unique Integrity:** Strict unique indexes for public IDs, email, phone, and candidate-requirement submission pairs.

---

## 2. Complete Index Specifications by Collection

---

### 2.1 Collection: `users`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_users_email_uniq` | `{ email: 1 }` | Unique | User Authentication / Sign-In | Immediate O(1) lookup on email login |
| `idx_users_userId_uniq` | `{ userId: 1 }` | Unique | Public User Profile URL / Lookup | Enforces unique user identifier |
| `idx_users_role_active` | `{ role: 1, active: 1 }` | Compound | User Management table role filter | Fast role dropdown filter in UI |
| `idx_users_teamId` | `{ teamId: 1 }` | Single | Lead's My Team page view | Retrieves all recruiters under a Team Lead |

---

### 2.2 Collection: `requirements`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_req_code_uniq` | `{ reqCode: 1 }` | Unique | Requirement Detail Overview | Instant lookup by `REQ-2026-08-12-001` |
| `idx_req_status_client` | `{ status: 1, clientId: 1, createdAt: -1 }` | Compound | Requirements Table Status & Client Filters | Primary query for requirements table |
| `idx_req_lead_status` | `{ assignedLeadId: 1, status: 1 }` | Compound | Team Lead Dashboard / Workspace | Filters requirements assigned to specific lead |
| `idx_req_recruiters` | `{ assignedRecruiterIds: 1, status: 1 }` | Compound | Recruiter My Workspace view | Multikey index covering recruiter assignments |
| `idx_req_text_search` | `{ title: "text", skillsRequired: "text" }` | Text Index | Requirement Search Input | Full-text search on position title & tech stack |

---

### 2.3 Collection: `candidates`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_cand_phone_uniq` | `{ phone: 1 }` | Unique | Duplicate Candidate Prevention | Prevents re-sourcing same phone number |
| `idx_cand_email_uniq` | `{ email: 1 }` | Unique | Duplicate Candidate Prevention | Prevents duplicate email candidate creation |
| `idx_cand_skills_exp` | `{ skills: 1, totalExperienceYears: 1 }` | Compound Multikey | Candidate Repository Skill & Exp Filters | Multikey index matching tech stack + YOE range |
| `idx_cand_notice_loc` | `{ noticePeriodDays: 1, currentLocation: 1 }` | Compound | Candidate Filter Dropdowns | Fast filter on notice period & location |
| `idx_cand_full_text` | `{ name: "text", currentCompany: "text", skills: "text" }` | Text Index | Global Candidate Repository Search | Rapid text search across resume keywords |

---

### 2.4 Collection: `submissions`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_sub_cand_req_uniq` | `{ candidateId: 1, requirementId: 1 }` | Compound Unique | Duplicate Submission Guard | Guarantees candidate submitted once per demand |
| `idx_sub_rec_stage` | `{ recruiterId: 1, stage: 1, submittedAt: -1 }` | Compound | Recruiter Total Submissions View | ESR rule query for recruiter's submissions |
| `idx_sub_lead_gate` | `{ leadId: 1, leadApprovalStatus: 1 }` | Compound | Submit to Lead Page / Approval Gate | Lists submissions pending Lead approval |
| `idx_sub_client_stage` | `{ clientId: 1, stage: 1 }` | Compound | Client Portal Candidate Review | Filters candidates submitted to client |

---

### 2.5 Collection: `interviews`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_int_sub_round` | `{ submissionId: 1, round: 1 }` | Compound | Interview Scheduler Round Check | Ensures valid sequential round progression |
| `idx_int_date_status` | `{ dateTime: 1, status: 1 }` | Compound | Interview Tracker Calendar & Date Filters | Filters upcoming / today's scheduled interviews |
| `idx_int_interviewer` | `{ interviewerEmail: 1, dateTime: 1 }` | Compound | Evaluator Schedule Lookup | Prevents overlapping interview scheduling |

---

### 2.6 Collection: `activity_logs` & `activity_logs`

| Index Name | Index Fields | Type | Supported Query / UI Operation | Performance Rationale |
|---|---|---|---|---|
| `idx_activity_user_time` | `{ userEmail: 1, timestamp: -1 }` | Compound | Activity Logs Page Filter | Retrieves user's audit trail chronologically |
| `idx_activity_category` | `{ category: 1, status: 1, timestamp: -1 }` | Compound | System Audit Logs Category Filter | Fast filtering on Submissions/Interviews logs |
| `idx_audit_ttl` | `{ createdAt: 1 }` | TTL (1095 days / 3 yrs) | Compliance Data Retention Policy | Auto-purges audit logs older than 3 years |

---

## 3. Index Creation Mongoose Script Example

```typescript
// Mongoose Index Initialization Definition
import { Schema } from 'mongoose';

export const RequirementSchema = new Schema({
  reqCode: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
  assignedLeadId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  assignedRecruiterIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  status: { type: String, enum: ['Open', 'Assigned', 'In Progress', 'On Hold', 'Reopen', 'Closed'], index: true },
  skillsRequired: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Compound Indexes for High-Frequency Queries
RequirementSchema.index({ status: 1, clientId: 1, createdAt: -1 });
RequirementSchema.index({ assignedLeadId: 1, status: 1 });
RequirementSchema.index({ title: 'text', skillsRequired: 'text' });
```
