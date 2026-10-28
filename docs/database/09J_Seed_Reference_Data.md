# MetaForge Recruiter Application V2 — Master Seed & Reference Data

**Document ID:** `docs/database/09J_Seed_Reference_Data.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. System Roles & Demo Seed Accounts

To match the existing demo accounts in `src/data/authService.ts` and `src/data/mockData.people.ts`, the seed script initializes the following `users` document records (passwords stored hashed):

| User ID | Role | Name | Email | Default Seed Password (Hashed) | Assigned Team / Scope |
|---|---|---|---|---|---|
| `USR-10001` | `superadmin` | Richard Haines | `r.haines@talentflow.io` | `$argon2id$v=19$m=65536...` | Global Super Admin |
| `USR-10002` | `admin` | David Park | `d.park@talentflow.io` | `$argon2id$v=19$m=65536...` | Organizational Admin |
| `USR-10003` | `lead` | Harish Gadipally | `harish.g@metaforgeit.com` | `$argon2id$v=19$m=65536...` | Team Lead Account |
| `USR-10004` | `recruiter` | Marcus Chen | `m.chen@talentflow.io` | `$argon2id$v=19$m=65536...` | Recruiter Account |
| `USR-10005` | `devteam` | Dev Team Admin | `dev.team@talentflow.io` | `$argon2id$v=19$m=65536...` | Platform Support & Audit |
| `USR-10006` | `client` | Accenture Account Lead | `client@accenture.com` | `$argon2id$v=19$m=65536...` | Client Account Scope |

---

## 2. Default RBAC Permission Matrix Seed (`roles_permissions`)

```json
[
  {
    "roleCode": "superadmin",
    "roleName": "Super Administrator",
    "permissions": [
      "req_view_all", "req_create", "req_edit", "req_assign", "req_delete",
      "cand_search", "cand_add", "cand_export", "cand_delete",
      "sub_create", "sub_view_all", "sub_reassign", "sub_move_stage",
      "int_schedule", "int_join_links", "int_feedback", "int_cancel",
      "rep_view_exec", "rep_view_recruiter", "rep_export_csv",
      "user_manage", "role_manage", "activity_logs"
    ]
  },
  {
    "roleCode": "admin",
    "roleName": "Administrator",
    "permissions": [
      "req_view_all", "req_create", "req_edit", "req_assign",
      "cand_search", "cand_add", "cand_export",
      "sub_create", "sub_view_all", "sub_reassign", "sub_move_stage",
      "int_schedule", "int_join_links", "int_feedback", "int_cancel",
      "rep_view_exec", "rep_view_recruiter", "user_manage"
    ]
  },
  {
    "roleCode": "lead",
    "roleName": "Team Lead",
    "permissions": [
      "req_view_all", "req_assign",
      "cand_search", "cand_add", "cand_export",
      "sub_create", "sub_view_all", "sub_reassign", "sub_move_stage",
      "int_schedule", "int_join_links", "int_feedback", "int_cancel",
      "rep_view_recruiter"
    ]
  },
  {
    "roleCode": "recruiter",
    "roleName": "Recruiter",
    "permissions": [
      "cand_search", "cand_add",
      "sub_create", "sub_move_stage",
      "int_schedule", "int_join_links", "int_feedback"
    ]
  }
]
```

---

## 3. Business Enums Reference Data

### 3.1 Requirement Statuses (`ReqStatus`)
`Open`, `Assigned`, `In Progress`, `On Hold`, `Reopen`, `Closed`

### 3.2 Submission Funnel Stages (`SubmissionStage`)
`Submitted`, `Submitted to Lead`, `Submitted to Client`, `Client Review`, `Interview Scheduled`, `Offered`, `Placed`, `Rejected`

### 3.3 Interview Rounds (`InterviewRound`)
`Screening`, `L1 Technical`, `L2 Technical`, `Manager Round`, `Client Round`, `HR Round`

### 3.4 Candidate Offer Statuses (`OfferStatus`)
`Offer Released`, `Accepted`, `Joined`, `Declined`, `Backed Out`
