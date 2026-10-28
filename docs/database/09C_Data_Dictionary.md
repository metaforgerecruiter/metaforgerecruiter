# MetaForge Recruiter Application V2 — Master Data Dictionary

**Document ID:** `docs/database/09C_Data_Dictionary.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Global Multi-Tenancy & Integrity Schema Standards

Every collection schema in MetaForge Recruiter V2 incorporates mandatory enterprise metadata fields:

| Field Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id`. Prefix in all compound indexes & pre-find query hooks. |
| `schemaVersion` | Number | Yes | `1` | Schema version tracking for backward-compatible `migrate-mongo` migrations. |
| `deletedAt` | Date | No | `null` | Uniform Soft-Delete timestamp. Suffix in all compound indexes & pre-find hooks. |
| `__v` | Number | Yes (in OCC collections) | `0` | Optimistic Concurrency Control (OCC) version key (`submissions`, `requirements`, `offers`). |

---

## 2. Collection Schemas Specification

---

### 2.1 Collection: `organizations`
**Purpose:** Enterprise Multi-Tenant Organization Accounts.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `name` | String | Yes | — | — | Unique | Organization Legal Name |
| `slug` | String | Yes | — | — | Unique | URL Slug |
| `tier` | String | Yes | `Professional` | Enum: `Starter`, `Professional`, `Enterprise` | Index | Account Subscription Tier |
| `active` | Boolean | Yes | `true` | — | Index | Active Account Status |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.2 Collection: `users`
**Purpose:** System user accounts, credentials, role assignments, and capability flags.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Organization Link |
| `userId` | String | Yes | `USR-xxxx` | — | Unique | Public User Identifier |
| `name` | String | Yes | — | — | Text | Full User Name |
| `email` | String | Yes | — | — | Unique | Work Email Address (Login) |
| `passwordHash` | String | Yes | — | — | No | Encrypted Password Hash |
| `role` | String | Yes | `recruiter` | Enum: `superadmin`, `admin`, `lead`, `recruiter`, `devteam`, `client` | Index | System Access Role |
| `teamId` | ObjectId | No | null | Ref: `teams._id` | Index | Team membership link |
| `clientId` | ObjectId | No | null | Ref: `clients._id` | Index | Client account link |
| `deletedAt` | Date | No | null | — | Index | Soft Delete Timestamp |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.3 Collection: `requirements` (OCC Enabled)
**Purpose:** Job Demands, staffing requirements, priority, assigned recruiters, openings, and SLA tracking.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `reqCode` | String | Yes | — | — | Unique | Public Requirement ID |
| `title` | String | Yes | — | — | Text | Job Position Title |
| `clientId` | ObjectId | Yes | — | Ref: `clients._id` | Index | Associated Client |
| `priority` | String | Yes | `Medium` | Enum: `High`, `Medium`, `Low`, `Urgent` | Index | Priority Tier |
| `status` | String | Yes | `Open` | Enum: `Open`, `Assigned`, `In Progress`, `On Hold`, `Reopen`, `Closed` | Index | Workflow Status |
| `__v` | Number | Yes | `0` | — | No | Mongoose OCC Version Key |
| `deletedAt` | Date | No | null | — | Index | Soft Delete Timestamp |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.4 Collection: `submissions` (OCC Enabled)
**Purpose:** Core recruitment transaction linking candidate to requirement across multi-tier approval stages.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `submissionId` | String | Yes | — | — | Unique | Public Submission ID |
| `candidateId` | ObjectId | Yes | — | Ref: `candidates._id` | Compound Unique | Submitted Candidate |
| `requirementId` | ObjectId | Yes | — | Ref: `requirements._id` | Compound Unique | Target Requirement |
| `stage` | String | Yes | `Submitted` | Enum: `Submitted`, `Submitted to Lead`, `Submitted to Client`, `Interview Scheduled`, `Offered`, `Placed`, `Rejected` | Index | Funnel Stage |
| `__v` | Number | Yes | `0` | — | No | Mongoose OCC Version Key |
| `deletedAt` | Date | No | null | — | Index | Soft Delete Timestamp |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.5 Collection: `interviews`
**Purpose:** Interview Scheduling, meeting links, stage tracking, and conflict detection.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `interviewId` | String | Yes | — | — | Unique | Public Interview Code |
| `interviewerEmail`| String | Yes | — | — | Index | Evaluator Email |
| `dateTime` | Date | Yes | — | — | Index | Scheduled Time |
| `durationMinutes` | Number | Yes | 60 | — | No | Meeting Duration (Minutes) |
| `status` | String | Yes | `Scheduled` | Enum: `Scheduled`, `Confirmed`, `Passed`, `Rejected`, `Cancelled` | Index | Interview Status |
| `deletedAt` | Date | No | null | — | Index | Soft Delete Timestamp |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.6 Collection: `offers` (OCC Enabled)
**Purpose:** Release of offer letters, CTC offered, joining dates, and onboarding track.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `offerId` | String | Yes | — | — | Unique | Public Offer ID |
| `submissionId` | ObjectId | Yes | — | Ref: `submissions._id` | Unique | Linked Submission |
| `offeredCtc` | Number | Yes | — | — | No | Annual Offered Compensation |
| `joiningDate` | Date | Yes | — | — | Index | Expected Joining Date |
| `status` | String | Yes | `Offer Released` | Enum: `Offer Released`, `Accepted`, `Joined`, `Declined`, `Backed Out` | Index | Onboarding Status |
| `__v` | Number | Yes | `0` | — | No | Mongoose OCC Version Key |
| `deletedAt` | Date | No | null | — | Index | Soft Delete Timestamp |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.7 Collection: `notifications` (New)
**Purpose:** User Notifications & Automated Alerts Feed.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `userId` | ObjectId | Yes | — | Ref: `users._id` | Index | Recipient User Link |
| `type` | String | Yes | — | Enum: `submission_approved`, `submission_rejected`, `interview_scheduled`, `interview_reminder`, `offer_released`, `candidate_placed`, `requirement_assigned`, `lead_approval_requested` | Index | Notification Category |
| `title` | String | Yes | — | — | No | Notification Title |
| `message` | String | Yes | — | — | No | Notification Body Message |
| `entityId` | ObjectId | Yes | — | — | No | Linked Entity `_id` |
| `entityType` | String | Yes | — | Enum: `submission`, `interview`, `offer`, `requirement`, `candidate` | No | Linked Entity Type |
| `readAt` | Date | No | null | — | Index | Timestamp when read |
| `createdAt` | Date | Yes | Auto | — | TTL Index | 90-Day Auto Expire |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.8 Collection: `email_templates` (New)
**Purpose:** Configurable Email Templates per Organization.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `name` | String | Yes | — | — | Unique per Org | Template Identifier Name |
| `subject` | String | Yes | — | — | No | Email Subject Line |
| `bodyHtml` | String | Yes | — | — | No | HTML Template Content |
| `variables` | Array | Yes | `[]` | String Array | No | Dynamic Variable Keys |
| `category` | String | Yes | — | Enum: `interview_invite`, `offer_letter`, `rejection`, `welcome` | No | Category |
| `isActive` | Boolean | Yes | `true` | — | No | Active Status |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.9 Collection: `candidate_blacklist` (New)
**Purpose:** Candidate Blacklist Repository.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `email` | String | Yes | — | — | Unique per Org | Blacklisted Email |
| `phone` | String | Yes | — | — | Unique per Org | Blacklisted Phone |
| `candidateId` | ObjectId | No | null | Ref: `candidates._id` | No | Optional Candidate Link |
| `reason` | String | Yes | — | — | No | Blacklist Reason |
| `blacklistedBy`| ObjectId | Yes | — | Ref: `users._id` | No | User who blacklisted |
| `blacklistedAt`| Date | Yes | Auto | — | No | Blacklisted Date |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |

---

### 2.10 Collection: `saved_searches` (New)
**Purpose:** User Saved Filter Queries.

| Field Name | Type | Required | Default | Enum / Reference | Index | Description |
|---|---|---|---|---|---|---|
| `_id` | ObjectId | Yes | Auto | — | PK | Unique Document ID |
| `orgId` | ObjectId | Yes | — | Ref: `organizations._id` | Index | Tenant Link |
| `userId` | ObjectId | Yes | — | Ref: `users._id` | Index | User Link |
| `name` | String | Yes | — | — | Unique per User | Saved Search Label |
| `filters` | Object | Yes | — | — | No | Filter Query Payload |
| `collection` | String | Yes | — | Enum: `candidates`, `requirements` | No | Target Collection |
| `schemaVersion`| Number | Yes | `1` | — | No | Schema Migration Version |
