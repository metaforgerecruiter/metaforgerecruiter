# MetaForge Recruiter Application V2 — Audit & History Architecture

**Document ID:** `docs/database/09E_Audit_And_History.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Dual Audit Architecture Overview

To satisfy both strict enterprise governance and operational history tracking, MetaForge Recruiter V2 employs a **Dual Audit Architecture**:

1. **Immutable System Audit & Activity Logs (`activity_logs`):** Append-only log recording user actions, IP addresses, authentication events, data modifications, and security alerts.
2. **State Transition Histories (`submission_histories` & `requirement_histories`):** Dedicated historical collections tracking stage progression, timestamps, status changes, reasons, and turnaround times (TAT).

```
                      ┌───────────────────────────────────────────────┐
                      │              User Action / API Call           │
                      └───────────────────────┬───────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
        ┌───────────▼────────────┐                         ┌────────────▼───────────┐
        │  Live State Mutation   │                         │ Immutable Security Log │
        │ (e.g. update `stage`)  │                         │  (`activity_logs`)     │
        └───────────┬────────────┘                         └────────────────────────┘
                    │
        ┌───────────▼────────────┐
        │ Historical Append      │
        │ (`submission_history`) │
        └────────────────────────┘
```

---

## 2. Collection Schema: `activity_logs`

```typescript
export interface ActivityLogDocument {
  _id: ObjectId;
  timestamp: Date;              // Immutable timestamp
  userId: ObjectId;             // Ref to User who performed action
  userName: string;             // Denormalized user name
  userEmail: string;            // Denormalized email
  userRole: RoleType;           // User role at time of action
  action: string;               // e.g. "Candidate Status Updated to Interview Scheduled"
  category: LogCategory;        // 'Submissions' | 'Requirements' | 'User Management' | 'Client Management' | 'Interviews' | 'System & Access'
  targetEntity: string;         // e.g. "Requirement", "Candidate", "Submission"
  targetId?: string;            // Business ID (e.g. REQ-2026-08-12-001)
  clientName?: string;          // Associated client name
  ipAddress: string;            // User IP address
  status: LogStatus;            // 'Success' | 'Warning' | 'Security Alert'
  details?: {
    previousValue?: any;
    newValue?: any;
    reason?: string;
    userAgent?: string;
  };
}
```

---

## 3. Workflow Turnaround Time (TAT) & Milestone Timestamps

The database stores explicit milestone timestamps on primary transactional documents to enable accurate TAT aggregation without scanning historical logs:

```
[Requirement Received] -> emailArrivedTime
         │
[Requirement Assigned] -> assignedAt
         │
[Candidate Sourced]    -> candidate.createdAt
         │
[Submitted to Lead]    -> submission.submittedAt
         │
[Lead Approved]        -> submission.leadApprovedAt  ===> (Lead TAT = leadApprovedAt - submittedAt)
         │
[Client Submitted]     -> submission.clientForwardedAt
         │
[Interview Conducted]  -> interview.dateTime
         │
[Offer Released]       -> offer.offerReleaseDate     ===> (Overall Sourcing TAT = offerReleaseDate - emailArrivedTime)
         │
[Candidate Joined]     -> offer.joiningDate
```

### TAT Aggregation Query Example (MongoDB Aggregation Pipeline)

```typescript
// Average Sourcing Turnaround Time (TAT) per Recruiter Pipeline
db.submissions.aggregate([
  { $match: { stage: 'Placed' } },
  {
    $lookup: {
      from: 'requirements',
      localField: 'requirementId',
      foreignField: '_id',
      as: 'req'
    }
  },
  { $unwind: '$req' },
  {
    $project: {
      recruiterId: 1,
      sourcingTatDays: {
        $divide: [
          { $subtract: ['$submittedAt', '$req.emailArrivedTime'] },
          1000 * 60 * 60 * 24 // Convert ms to days
        ]
      }
    }
  },
  {
    $group: {
      _id: '$recruiterId',
      avgSourcingTat: { $avg: '$sourcingTatDays' },
      totalPlacements: { $sum: 1 }
    }
  }
]);
```

---

## 4. History Tracking Capabilities Matrix

| Workflow Domain | What is Tracked? | Responsible Entity | Data Captured | Reporting Purpose |
|---|---|---|---|---|
| **Requirement Ingestion** | Revoke requests, lead reassignment, priority changes | `requirement_histories` | Old lead, new lead, revoke reason, requested by | Reassignment audit & SLA tracking |
| **Submission Funnel** | Stage moves (Submitted -> Lead -> Client -> Interview -> Placed) | `submission_histories` | Previous stage, new stage, lead feedback, timestamp | Funnel conversion rate & bottleneck analysis |
| **Interview Scheduling** | Rescheduling, cancellations, round results | `interview_feedbacks` | Round score, evaluator notes, technical rating | Candidate quality rating & interviewer productivity |
| **Offer Outcome** | Offer release, candidate joining, backed-out notes | `offers` | Offer CTC, joining date, non-joining reason | Backout analysis & offer conversion ratio |
