# MetaForge Recruiter Application V2 — Frontend to Database Traceability Matrix

**Document ID:** `docs/database/09M_Frontend_Database_Traceability.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Traceability Matrix Architecture

This matrix validates that **every single UI page, component, search field, filter, form input, and table column** in the MetaForge Recruiter V2 frontend is 100% mapped to a supporting database schema field and supporting index.

---

## 2. Complete Frontend Traceability Catalog

| Frontend Page | UI Component / Action | Data Displayed / Entered | Target Collection | Database Fields | Index Used |
|---|---|---|---|---|---|
| **Requirements Page** | Requirements Table Filter | Status (`Open`, `Hold`, `Closed`), Client dropdown | `requirements` | `status`, `clientId`, `createdAt` | `idx_req_status_client` |
| | Search Requirement Input | Text query matching position title | `requirements` | `title`, `skillsRequired` | `idx_req_text_search` |
| | Requirement Status Dropdown | Switch status (`Open`, `Hold`, `Reopen`, `Custom`) | `requirements` | `status`, `updatedAt` | `idx_req_status_client` |
| | Revoke Demand Action Modal | Revoke reason & requester info | `requirements` & `requirement_histories` | `revokeRequested`, `revokeReason` | `idx_req_code_uniq` |
| **Add Candidate Page** | Manual Form Submission | Candidate contact, YOE, CTC, skills | `candidates` | `name`, `email`, `phone`, `skills`, `totalExperienceYears` | `idx_cand_phone_uniq`, `idx_cand_email_uniq` |
| | Resume File Upload | Resume file parsing & upload | `file_metadata` & `ai_parsing_jobs` | `originalName`, `storageKey`, `scanStatus` | Single `fileId` index |
| **Candidate Repository** | Skill & Experience Filter | Min/Max YOE, notice period, location | `candidates` | `skills`, `totalExperienceYears`, `noticePeriodDays` | `idx_cand_skills_exp`, `idx_cand_notice_loc` |
| | Full-Text Resume Search | Keyword search input | `candidates` | `name`, `currentCompany`, `skills` | `idx_cand_full_text` |
| | Candidate Details Modal | Candidate contact, experience, skills, remarks | `candidates` | `email`, `phone`, `skills`, `totalExperienceYears` | `idx_cand_phone_uniq` |
| **Submissions Page** | Submissions Table Filter | Stage dropdown (`Submitted`, `Interview Scheduled`, `Placed`) | `submissions` | `stage`, `recruiterId`, `submittedAt` | `idx_sub_rec_stage` |
| | Submit to Lead Page | Pending Lead review list | `submissions` | `leadId`, `leadApprovalStatus` | `idx_sub_lead_gate` |
| | Submit Candidate Modal | Link candidate to requirement | `submissions` | `candidateId`, `requirementId`, `matchScore` | `idx_sub_cand_req_uniq` |
| **Interview Tracking** | Interview Schedule Table | Candidates scheduled today, round, mode | `interviews` | `dateTime`, `round`, `mode`, `status` | `idx_int_date_status` |
| | Candidate Evaluation Modal | General Remark vs Candidate Rejected input | `interviews` & `interview_feedbacks` | `status`, `rejectionReason`, `evaluatorNotes` | `idx_int_sub_round` |
| **Client Management** | Client Delivery Gap Analysis | Client SLA, delivery gap score, active demands | `clients` & `requirements` | `deliveryGapScore`, `slaDays`, `status` | `idx_req_status_client` |
| **User Governance** | User Management Table | Role, active toggle, team lead link | `users` & `teams` | `role`, `active`, `teamId`, `capabilities` | `idx_users_role_active` |
| **Activity Logs Page** | Audit Trail Table | Timestamp, user email, action, category, status | `activity_logs` | `timestamp`, `userEmail`, `category`, `status` | `idx_activity_user_time`, `idx_activity_category` |
| **Reports & Dashboards**| Premium Reports & KPIs | Daily submissions, placements count, TAT | `recruiter_analytics` & `submissions` | `submittedAt`, `stage`, `emailArrivedTime` | Aggregation Pipeline Covered Indexes |
