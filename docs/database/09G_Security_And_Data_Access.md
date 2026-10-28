# MetaForge Recruiter Application V2 — Security & Data-Level Access

**Document ID:** `docs/database/09G_Security_And_Data_Access.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Security Architecture Overview

The security layer of MetaForge Recruiter V2 spans **Authentication**, **Role-Based Access Control (RBAC)**, **Data-Level Tenant Scoping**, and **PII Protection**.

```
[Incoming Request]
       │
       ▼
[JWT Auth Guard] ──> Validates Token & Injects User Context (User ID, Role, Team ID, Client ID)
       │
       ▼
[RBAC Guard] ─────> Validates User Role against Requested Permission Key (e.g. `req_edit`)
       │
       ▼
[Mongoose Scoping Plugin] ──> Automatically injects `{ assignedLeadId: user.id }` or `{ recruiterId: user.id }`
       │
       ▼
[MongoDB Storage] (Encrypted At Rest & In Transit via TLS 1.3)
```

---

## 2. RBAC Permission Matrix & Collection Mapping

The permission rules defined in `UserManagementPage.tsx` and `RolesPermissionsPage.tsx` map directly to database operations:

| Permission Key | Super Admin | Admin | Team Lead | Recruiter | Dev Team | Client | Supported Database Query Scope |
|---|---|---|---|---|---|---|---|
| `req_view_all` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | `requirements.find({})` |
| `req_create` | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | `requirements.insertOne()` |
| `req_edit` | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | `requirements.updateOne()` |
| `req_assign` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | `requirements.updateOne({ assignedLeadId, assignedRecruiters })` |
| `cand_search` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | `candidates.find()` |
| `cand_add` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | `candidates.insertOne()` |
| `sub_create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | `submissions.insertOne()` |
| `sub_reassign` | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | `submissions.updateOne({ recruiterId })` |
| `sub_move_stage` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | `submissions.updateOne({ stage })` |
| `int_schedule` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | `interviews.insertOne()` |
| `user_manage` | ✓ | ✓ (View) | ✗ | ✗ | ✓ | ✗ | `users.find()`, `users.updateOne()` |
| `activity_logs` | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | `activity_logs.find()` |

---

## 3. Data Scoping Engine (Mongoose Query Hooks)

To prevent accidental cross-tenant or cross-recruiter data leaks, Mongoose schemas register automatic pre-find middleware hooks:

```typescript
// Mongoose Plugin for Automated Recruiter & Team Data Isolation
export function DataScopePlugin(schema: Schema) {
  schema.pre(['find', 'findOne', 'countDocuments'], function () {
    const user = this.getOptions().currentUser; // Injected by NestJS Interceptor
    if (!user) return; // System background jobs

    if (user.role === 'recruiter') {
      this.where({
        $or: [
          { recruiterId: user.userId },
          { assignedRecruiters: user.userId },
          { createdBy: user.userId }
        ]
      });
    } else if (user.role === 'lead') {
      this.where({
        $or: [
          { assignedLeadId: user.userId },
          { recruiterId: { $in: user.teamRecruiterIds } },
          { leadId: user.userId }
        ]
      });
    } else if (user.role === 'client') {
      this.where({ clientId: user.clientId });
    }
  });
}
```

---

## 4. PII Protection & Field-Level Security

1. **Password Hashing:** All password hashes (`passwordHash`) are stored using **Argon2id** (or Bcrypt with cost factor 12). Plain text passwords never touch the database.
2. **Sensitive Candidate PII:** Current CTC, Expected CTC, Phone, and Email fields are restricted in response DTOs for client-role users.
3. **Encryption at Rest:** Database volumes utilize AWS KMS / MongoDB FLE (Field-Level Encryption) for candidates' contact details.
4. **TLS in Transit:** Mandatory TLS 1.3 connection strings (`mongodb+srv://...&ssl=true`).
