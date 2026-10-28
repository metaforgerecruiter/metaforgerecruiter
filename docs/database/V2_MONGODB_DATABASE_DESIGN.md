# V2 MongoDB Database Architecture & Design

This document details the complete specification of the **V2 MongoDB database** for the recruitment platform. It builds upon the V1 PostgreSQL schema export (`V1_DATABASE_EXPORT.md`), resolves all legacy data quirks and concurrency issues, incorporates all dropped V1 fields, and guarantees full compatibility with the **V2 UI screens** (`frontend/src/`).

---

## 1. Embed vs. Reference Architectural Decisions

| V1 Table | V2 MongoDB Entity / Decision | Pattern | Rationale & Trade-offs |
|---|---|---|---|
| `counters` | **New Collection** | Top-level Collection | Replaces V1 PostgreSQL `generate_requirement_id()` and `generate_candidate_code()` functions. Uses atomic `findOneAndUpdate` with `$inc` to eliminate race conditions under concurrent creations. |
| `recruiters` | `recruiters` | Top-level Collection | Core user entity shared across requirements, submissions, assignments, and audit logs. Expanded to support V2 UI roles (`superadmin`, `admin`, `lead`, `recruiter`, `devteam`, `client`). Includes `tokenVersion` and `passwordChangedAt` for instant global logout on password change. |
| `clients` | `clients` | Top-level Collection | Independent business entity with organizational metadata, contact details, and client delivery gap analytics. |
| `requirements` | `requirements` | Top-level Collection | Job demands/openings. **Embeds** recruiter assignments (`assignments: [{ recruiterId, assignedBy, assignedAt, isActive }]`). **References** `clientId` and `ownerId`. Contains atomic counter fields (`submissionsCount`, `placed`, `interviewsCount`) and soft-delete flags. |
| `requirement_assignments` | **Embedded inside `requirements`** | Embedded Sub-documents | V1 separate junction table is simplified into an array of sub-documents inside each requirement document. Unique array validation prevents duplicate recruiter assignments. |
| `candidates` | `candidates` | Top-level Collection | Master candidate talent pool searched independently by skills, location, experience, and CTC. Referenced by `candidate_submissions`. |
| `candidate_submissions` | `candidate_submissions` | Top-level Collection | High-volume transactional pipeline record linking `candidateId`, `requirementId`, and `submittedBy`. Kept separate because submissions are queried bi-directionally (from candidate profile & requirement pipeline view). |
| `user_sessions` | **Stateless JWT + `token_blacklists`** | Auth Strategy / TTL Collection | Replaced by stateless JWT authentication with embedded `tokenVersion`. A lightweight `token_blacklists` collection with a TTL index handles immediate token invalidation on explicit logout without incurring per-request DB session lookup overhead. |
| `activity_logs` | `activity_logs` | Top-level Collection (with 1-Year TTL / Archival) | Append-only change history. Uses a 365-day TTL index on `changedAt` (with automated S3/Mongo Data Lake archiving before purge) to replace V1's unbounded table growth while enabling historical auditing. |

---

## 2. Solutions to V1 Data Quirks & Known Issues

### 2.1 CTC Data Standardized (Full Annual INR Amount)
* **V1 Bug:** `candidates.current_ctc` was `DECIMAL`, while `candidate_submissions.current_ctc` was `VARCHAR` (`"12 LPA"`).
* **V2 Fix:** All CTC values (`currentCtc`, `expectedCtc`) across both `Candidate` and `CandidateSubmission` are strictly defined as **Numbers representing the full annual CTC amount in INR** (e.g., `1200000` for ₹12 Lakhs). Ambiguous LPA string formats are eliminated.

### 2.2 Re-instated V1 Fields & Alignment
All V1 fields are fully preserved in V2:
* **Requirements:** `submittingTo` (String), `clientJdId` (String), `assignedBy` (ObjectId/String), `updatedBy` (ObjectId/String).
* **Candidate Submissions:** `interviewDate` (Date), `interviewFeedback` (String), `selectionDate` (Date), alongside the V2 embedded `interviews` round history array.

### 2.3 Strict Soft Delete Handling
* **Requirements Collection:** Soft deletes use `isDeleted: Boolean` (default: `false`), `deletedAt: Date`, and `deletedBy: ObjectId`.
* **Mongoose Hook Fix:** Pre-find query middleware checks `this.getOptions().includeDeleted` (not filter options).
* **Aggregations:** All aggregation pipelines explicitly enforce `{ $match: { isDeleted: false } }`.

### 2.4 Race-Condition Free Human-Readable IDs
* Replaces PostgreSQL `SELECT MAX(...)` substring scans with an atomic MongoDB `counters` collection updated via `findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })`.

### 2.5 Duplicate Recruiter Assignment Prevention
* `requirements.assignments` array enforces uniqueness of `recruiterId` via a custom Mongoose array validator and application-level update operators (`$addToSet`).

### 2.6 Atomic Metrics Counters via `$inc`
* When a submission is created, updated, or deleted, requirement metrics (`submissionsCount`, `interviewsCount`, `placed`) are updated atomically on `Requirement` using `findByIdAndUpdate(reqId, { $inc: { ... } })` to prevent read-modify-write race conditions.

### 2.7 Global JWT Invalidation (`tokenVersion`)
* `Recruiter` schema includes `tokenVersion: Number` (default: 1) and `passwordChangedAt: Date`.
* When a user updates their password, `tokenVersion` is atomically incremented (`$inc: { tokenVersion: 1 }`).
* JWT payloads include `{ userId, tokenVersion }`. Authentication middleware validates that `jwt.tokenVersion === user.tokenVersion`, instantly logging out all active sessions upon password change without requiring persistent session rows.

---

## 3. V2 UI Features Supported & Enhancements Added

From inspection of `frontend/src/` (`types/index.ts`, `components/pages/`), the database schema supports:

* **Extended User Roles:** `'superadmin' | 'admin' | 'lead' | 'recruiter' | 'devteam' | 'client'`.
* **Clean Requirement Status Enum:** `['Open', 'Assigned', 'Submitted', 'Interview', 'Selected', 'Rejected', 'Closed', 'On Hold', 'Reopen', 'Active']`.
* **Requirement Revocation Workflow:** `revokeRequested`, `revokeReason`, `revokeRequestedBy`, `revokeRequestedAt`.
* **Pipeline Stages:** `'Submitted' | 'Submitted to Lead' | 'Submitted to Client' | 'Client Review' | 'Interview Scheduled' | 'Offered' | 'Placed' | 'Rejected'`.
* **Embedded Interview Schedule & History:** Multi-round interview tracking for `InterviewTrackingPage.tsx`.
* **Candidate Match Score & Parsing Status:** `matchScore` and candidate parser status (`'New' | 'Parsed' | 'Submitted' | 'In Review' | 'Placed'`).

---

## 4. Collection Catalog & JSON Schema Validations

### 4.1 `counters` Collection
* **Purpose:** Atomic sequence generator for human-readable IDs.
* **Fields:** `_id` (String, e.g. `"req_2026-03-24"`), `seq` (Number, default: 0).

### 4.2 `recruiters` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["name", "email", "passwordHash", "role", "tokenVersion"],
    "properties": {
      "name": { "bsonType": "string" },
      "email": { "bsonType": "string", "pattern": "^.+@.+$" },
      "passwordHash": { "bsonType": "string" },
      "role": { "enum": ["superadmin", "admin", "lead", "recruiter", "devteam", "client"] },
      "tokenVersion": { "bsonType": "int" },
      "passwordChangedAt": { "bsonType": ["date", "null"] },
      "isActive": { "bsonType": "bool" }
    }
  }
}
```
* **Indexes:** Unique `{ email: 1 }`, Compound `{ role: 1, isActive: 1 }`, `{ leadId: 1 }`.

### 4.3 `clients` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["name", "email"],
    "properties": {
      "name": { "bsonType": "string" },
      "email": { "bsonType": "string", "pattern": "^.+@.+$" },
      "isActive": { "bsonType": "bool" }
    }
  }
}
```
* **Indexes:** Unique `{ email: 1 }`, Single `{ name: 1 }`.

### 4.4 `requirements` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["reqCode", "roleTitle", "clientId", "ownerId", "skills", "clientLeadPoc"],
    "properties": {
      "reqCode": { "bsonType": "string", "pattern": "^REQ-\\d{4}-\\d{2}-\\d{2}-\\d{3}$" },
      "clientLeadPoc": { "bsonType": "string" },
      "clientPoc": { "bsonType": ["string", "null"] },
      "submittingTo": { "bsonType": ["string", "null"] },
      "clientJdId": { "bsonType": ["string", "null"] },
      "priority": { "enum": ["High", "Medium", "Low"] },
      "status": { 
        "enum": ["Open", "Assigned", "Submitted", "Interview", "Selected", "Rejected", "Closed", "On Hold", "Reopen", "Active"] 
      },
      "assignmentStatus": { "enum": ["Unassigned", "Assigned", "In Progress", "Closed"] },
      "isDeleted": { "bsonType": "bool" }
    }
  }
}
```
* **Indexes:**
  * Unique: `{ reqCode: 1 }`
  * Compound: `{ status: 1, isDeleted: 1 }`, `{ clientId: 1, isDeleted: 1 }`, `{ ownerId: 1, isDeleted: 1 }`, `{ priority: 1 }`, `{ createdAt: -1 }`
  * Text Index: `{ roleTitle: "text", skills: "text", technologies: "text" }`

### 4.5 `candidates` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["name", "email"],
    "properties": {
      "candidateCode": { "bsonType": ["string", "null"], "pattern": "^Cand-\\d{4}-\\d{2}-\\d{2}-\\d{3}$" },
      "email": { "bsonType": "string", "pattern": "^.+@.+$" },
      "currentCtc": { "bsonType": ["double", "int", "long", "null"] },
      "expectedCtc": { "bsonType": ["double", "int", "long", "null"] }
    }
  }
}
```
* **Indexes:**
  * Unique: `{ email: 1 }`, `{ candidateCode: 1 }` (sparse)
  * Multikey: `{ technologies: 1 }`, `{ skills: 1 }`
  * Compound: `{ location: 1, preferredLocation: 1 }`
  * Text Index: `{ name: "text", resumeText: "text", skills: "text", technologies: "text" }`

### 4.6 `candidate_submissions` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["candidateId", "requirementId", "submittedBy", "stage"],
    "properties": {
      "stage": {
        "enum": [
          "Submitted", "Submitted to Lead", "Submitted to Client",
          "Client Review", "Interview Scheduled", "Offered", "Placed", "Rejected"
        ]
      },
      "currentCtc": { "bsonType": ["double", "int", "long", "null"] },
      "expectedCtc": { "bsonType": ["double", "int", "long", "null"] },
      "interviewDate": { "bsonType": ["date", "null"] },
      "selectionDate": { "bsonType": ["date", "null"] }
    }
  }
}
```
* **Indexes:**
  * Unique Compound Constraint: `{ candidateId: 1, requirementId: 1 }`
  * Compound: `{ requirementId: 1, stage: 1 }`, `{ candidateId: 1 }`, `{ submittedBy: 1 }`, `{ submittedOn: -1 }`

### 4.7 `activity_logs` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["entityName", "entityId", "action", "changedAt"],
    "properties": {
      "entityName": { "bsonType": "string" },
      "entityId": { "bsonType": "string" },
      "action": { "enum": ["INSERT", "UPDATE", "DELETE"] },
      "changedBy": { "bsonType": ["objectId", "null"] },
      "changedAt": { "bsonType": "date" },
      "category": { "bsonType": ["string", "null"] }
    }
  }
}
```
* **Indexes:** Compound `{ entityName: 1, entityId: 1 }`, `{ changedBy: 1 }`, **TTL Index:** `{ changedAt: 1 }` (`expireAfterSeconds: 31536000` — 365 days retention).

### 4.8 `token_blacklists` Collection
```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["token", "expiresAt"],
    "properties": {
      "token": { "bsonType": "string" },
      "expiresAt": { "bsonType": "date" }
    }
  }
}
```
* **Indexes:** Unique `{ token: 1 }`, **TTL Index:** `{ expiresAt: 1 }` (`expireAfterSeconds: 0`).

---

## 5. Field-Level V1 -> V2 Mapping & Migration Strategy

### 5.1 Field Renaming & Type Mapping
| V1 Table.Column | Data Type | V2 Collection.Field | Data Type | Notes / Transformations |
|---|---|---|---|---|
| `recruiters.id` | UUID | `recruiters._id` | ObjectId | Primary Key |
| `recruiters.password_hash` | VARCHAR | `recruiters.passwordHash` | String | camelCase |
| `requirements.id` | VARCHAR | `requirements.reqCode` | String | Custom code (`REQ-YYYY-MM-DD-XXX`) |
| `requirements.client_id` | UUID | `requirements.clientId` | ObjectId | Ref to `clients` |
| `requirements.owner_id` | UUID | `requirements.ownerId` | ObjectId | Ref to `recruiters` |
| `requirements.submitting_to` | VARCHAR | `requirements.submittingTo` | String | Re-instated field |
| `requirements.client_jd_id` | VARCHAR | `requirements.clientJdId` | String | Re-instated field |
| `requirements.assigned_by` | VARCHAR | `requirements.assignedBy` | ObjectId/String | Re-instated field |
| `requirements.updated_by` | VARCHAR | `requirements.updatedBy` | ObjectId/String | Re-instated field |
| `requirement_assignments.*` | Table | `requirements.assignments` | Array | Embedded array inside requirement |
| `candidates.current_ctc` | DECIMAL | `candidates.currentCtc` | **Number** | Converted to full annual INR amount |
| `candidates.expected_ctc` | DECIMAL | `candidates.expectedCtc` | **Number** | Converted to full annual INR amount |
| `candidate_submissions.current_ctc` | VARCHAR | `candidate_submissions.currentCtc` | **Number** | Converted from string to full annual INR amount |
| `candidate_submissions.expected_ctc` | VARCHAR | `candidate_submissions.expectedCtc` | **Number** | Converted from string to full annual INR amount |
| `candidate_submissions.status` | VARCHAR | `candidate_submissions.stage` | String | Renamed & mapped to pipeline stage |
| `candidate_submissions.interview_date` | TIMESTAMPTZ | `candidate_submissions.interviewDate` | Date | Re-instated field |
| `candidate_submissions.interview_feedback` | TEXT | `candidate_submissions.interviewFeedback` | String | Re-instated field |
| `candidate_submissions.selection_date` | TIMESTAMPTZ | `candidate_submissions.selectionDate` | Date | Re-instated field |

### 5.2 Status Values Migration Rules
| Domain | V1 Value | V2 Target Value | Migration Transformation |
|---|---|---|---|
| **Submission** | `'Submitted'` | `'Submitted'` | Standard mapping |
| **Submission** | `'Interview'` | `'Interview Scheduled'` | Renamed to fit V2 tracking pipeline |
| **Submission** | `'Selected'` | `'Placed'` (or `'Offered'`) | Standardized pipeline outcome |
| **Submission** | `'Rejected'` | `'Rejected'` | Standard mapping |
| **Requirement** | `'Open'` | `'Open'` | Standard mapping |
| **Requirement** | `'Assigned'` | `'Assigned'` | Standard mapping |
| **Requirement** | `'Submitted'` | `'Submitted'` | Standard mapping |
| **Requirement** | `'Interview'` | `'Interview'` | Standard mapping |
| **Requirement** | `'Selected'` | `'Selected'` | Standard mapping |
| **Requirement** | `'Closed'` | `'Closed'` | Standard mapping |
| **Requirement** | `'Rejected'` | `'Closed'` (or `'On Hold'`) | Cleaned up enum mapping |

---

## 6. Complete Mongoose Models (TypeScript)

```typescript
import { Schema, model, Document, Types } from 'mongoose';

// ==========================================
// 1. COUNTER MODEL (Safe ID Generator)
// ==========================================
export interface ICounter extends Document {
  _id: string;
  seq: number;
}
const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
export const Counter = model<ICounter>('Counter', CounterSchema);

export async function generateCustomId(prefix: 'REQ' | 'Cand'): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const counterId = `${prefix.toLowerCase()}_${dateStr}`;
  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${dateStr}-${String(counter.seq).padStart(3, '0')}`;
}

// ==========================================
// 2. RECRUITER MODEL
// ==========================================
export interface IRecruiter extends Document {
  name: string;
  email: string;
  passwordHash: string;
  title: string;
  role: 'superadmin' | 'admin' | 'lead' | 'recruiter' | 'devteam' | 'client';
  phone?: string;
  isActive: boolean;
  tokenVersion: number;
  passwordChangedAt?: Date;
  leadId?: Types.ObjectId;
  lastLogin?: Date;
  target?: number;
  primaryClient?: string;
}

const RecruiterSchema = new Schema<IRecruiter>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  title: { type: String, default: 'Recruiter' },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'lead', 'recruiter', 'devteam', 'client'], 
    default: 'recruiter' 
  },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  tokenVersion: { type: Number, default: 1 },
  passwordChangedAt: { type: Date },
  leadId: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  lastLogin: { type: Date },
  target: { type: Number, default: 0 },
  primaryClient: { type: String }
}, { timestamps: true });

RecruiterSchema.index({ role: 1, isActive: 1 });
RecruiterSchema.index({ leadId: 1 });

export const Recruiter = model<IRecruiter>('Recruiter', RecruiterSchema);

// ==========================================
// 3. CLIENT MODEL
// ==========================================
export interface IClient extends Document {
  name: string;
  email: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  isActive: boolean;
}

const ClientSchema = new Schema<IClient>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String },
  industry: { type: String },
  companySize: { type: String },
  address: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ClientSchema.index({ name: 1 });

export const Client = model<IClient>('Client', ClientSchema);

// ==========================================
// 4. REQUIREMENT MODEL (With Embedded Assignments)
// ==========================================
export interface IAssignment {
  recruiterId: Types.ObjectId;
  assignedBy?: Types.ObjectId;
  assignedAt: Date;
  isActive: boolean;
}

export interface IRequirement extends Document {
  reqCode: string;
  clientId: Types.ObjectId;
  clientLeadPoc: string;
  clientPoc?: string;
  submittingTo?: string;
  clientJdId?: string;
  roleTitle: string;
  location?: string;
  experience?: string;
  noticePeriod?: string;
  skills: string[];
  technologies?: string[];
  priority: 'High' | 'Medium' | 'Low';
  openPositions: number;
  slaDays: number;
  description?: string;
  status: 'Open' | 'Assigned' | 'Submitted' | 'Interview' | 'Selected' | 'Rejected' | 'Closed' | 'On Hold' | 'Reopen' | 'Active';
  assignmentStatus: 'Unassigned' | 'Assigned' | 'In Progress' | 'Closed';
  submissionsCount: number;
  placed: number;
  interviewsCount: number;
  ownerId: Types.ObjectId;
  assignedBy?: string;
  updatedBy?: string;
  assignments: IAssignment[];
  revokeRequested?: boolean;
  revokeReason?: string;
  revokeRequestedBy?: Types.ObjectId;
  revokeRequestedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

const AssignmentSchema = new Schema<IAssignment>({
  recruiterId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  assignedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { _id: false });

const RequirementSchema = new Schema<IRequirement>({
  reqCode: { type: String, required: true, unique: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  clientLeadPoc: { type: String, required: true },
  clientPoc: { type: String },
  submittingTo: { type: String },
  clientJdId: { type: String },
  roleTitle: { type: String, required: true },
  location: { type: String },
  experience: { type: String },
  noticePeriod: { type: String },
  skills: [{ type: String, required: true }],
  technologies: [{ type: String }],
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  openPositions: { type: Number, default: 1 },
  slaDays: { type: Number, default: 30 },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Open', 'Assigned', 'Submitted', 'Interview', 'Selected', 'Rejected', 'Closed', 'On Hold', 'Reopen', 'Active'], 
    default: 'Open' 
  },
  assignmentStatus: { 
    type: String, 
    enum: ['Unassigned', 'Assigned', 'In Progress', 'Closed'], 
    default: 'Unassigned' 
  },
  submissionsCount: { type: Number, default: 0 },
  placed: { type: Number, default: 0 },
  interviewsCount: { type: Number, default: 0 },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  assignedBy: { type: String },
  updatedBy: { type: String },
  assignments: {
    type: [AssignmentSchema],
    validate: {
      validator: function(val: IAssignment[]) {
        const ids = val.map(a => a.recruiterId.toString());
        return ids.length === new Set(ids).size;
      },
      message: 'Duplicate recruiter assignments are not allowed on a single requirement.'
    }
  },
  revokeRequested: { type: Boolean, default: false },
  revokeReason: { type: String },
  revokeRequestedBy: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  revokeRequestedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'Recruiter' }
}, { timestamps: true });

RequirementSchema.index({ status: 1, isDeleted: 1 });
RequirementSchema.index({ clientId: 1, isDeleted: 1 });
RequirementSchema.index({ ownerId: 1, isDeleted: 1 });
RequirementSchema.index({ priority: 1 });
RequirementSchema.index({ roleTitle: 'text', skills: 'text', technologies: 'text' });

RequirementSchema.pre(/^find/, function (next) {
  // @ts-ignore
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

export const Requirement = model<IRequirement>('Requirement', RequirementSchema);

// ==========================================
// 5. CANDIDATE MODEL
// ==========================================
export interface ICandidate extends Document {
  candidateCode?: string;
  name: string;
  email: string;
  phone?: string;
  currentEmployer?: string;
  location?: string;
  experienceLabel?: string;
  technologies?: string[];
  skills?: string[];
  resumeRef?: string;
  resumeText?: string;
  linkedinUrl?: string;
  highestQualification?: string;
  currentCtc?: number;  // Full annual INR amount
  expectedCtc?: number; // Full annual INR amount
  noticePeriod?: string;
  preferredLocation?: string;
  availableForInterview: boolean;
  reasonForJobChange?: string;
  offerInHand: boolean;
  matchScore?: string;
  status: 'New' | 'Parsed' | 'Submitted' | 'In Review' | 'Placed';
}

const CandidateSchema = new Schema<ICandidate>({
  candidateCode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  currentEmployer: { type: String },
  location: { type: String },
  experienceLabel: { type: String },
  technologies: [{ type: String }],
  skills: [{ type: String }],
  resumeRef: { type: String },
  resumeText: { type: String },
  linkedinUrl: { type: String },
  highestQualification: { type: String },
  currentCtc: { type: Number },
  expectedCtc: { type: Number },
  noticePeriod: { type: String },
  preferredLocation: { type: String },
  availableForInterview: { type: Boolean, default: true },
  reasonForJobChange: { type: String },
  offerInHand: { type: Boolean, default: false },
  matchScore: { type: String },
  status: { 
    type: String, 
    enum: ['New', 'Parsed', 'Submitted', 'In Review', 'Placed'], 
    default: 'New' 
  }
}, { timestamps: true });

CandidateSchema.index({ technologies: 1 });
CandidateSchema.index({ skills: 1 });
CandidateSchema.index({ location: 1, preferredLocation: 1 });
CandidateSchema.index({ name: 'text', resumeText: 'text', skills: 'text', technologies: 'text' });

export const Candidate = model<ICandidate>('Candidate', CandidateSchema);

// ==========================================
// 6. CANDIDATE SUBMISSION MODEL
// ==========================================
export interface IInterviewRound {
  stage: 'Screening' | 'Technical Round 1' | 'Technical Round 2' | 'HR Round' | 'Manager Round' | 'Final Round';
  date: Date;
  status: 'Scheduled' | 'Confirmed' | 'Pending' | 'Passed' | 'Rejected';
  notes?: string;
}

export interface ICandidateSubmission extends Document {
  candidateId: Types.ObjectId;
  requirementId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  submittedOn: Date;
  stage: 'Submitted' | 'Submitted to Lead' | 'Submitted to Client' | 'Client Review' | 'Interview Scheduled' | 'Offered' | 'Placed' | 'Rejected';
  soNumber?: string;
  totalExperience?: string;
  relevantExperience?: string;
  currentCtc?: number;  // Full annual INR amount
  expectedCtc?: number; // Full annual INR amount
  noticePeriod?: string;
  currentLocation?: string;
  preferredLocation?: string;
  availableForInterview?: boolean;
  reasonForJobChange?: string;
  offerInHand?: boolean;
  linkedinUrl?: string;
  highestQualification?: string;
  interviewDate?: Date;
  interviewFeedback?: string;
  selectionDate?: Date;
  interviews: IInterviewRound[];
  rejectionReason?: string;
}

const InterviewRoundSchema = new Schema<IInterviewRound>({
  stage: { 
    type: String, 
    enum: ['Screening', 'Technical Round 1', 'Technical Round 2', 'HR Round', 'Manager Round', 'Final Round'],
    required: true 
  },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'Pending', 'Passed', 'Rejected'], 
    default: 'Scheduled' 
  },
  notes: { type: String }
}, { _id: false });

const CandidateSubmissionSchema = new Schema<ICandidateSubmission>({
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  requirementId: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  submittedOn: { type: Date, default: Date.now },
  stage: { 
    type: String, 
    enum: ['Submitted', 'Submitted to Lead', 'Submitted to Client', 'Client Review', 'Interview Scheduled', 'Offered', 'Placed', 'Rejected'], 
    default: 'Submitted' 
  },
  soNumber: { type: String },
  totalExperience: { type: String },
  relevantExperience: { type: String },
  currentCtc: { type: Number },
  expectedCtc: { type: Number },
  noticePeriod: { type: String },
  currentLocation: { type: String },
  preferredLocation: { type: String },
  availableForInterview: { type: Boolean },
  reasonForJobChange: { type: String },
  offerInHand: { type: Boolean },
  linkedinUrl: { type: String },
  highestQualification: { type: String },
  interviewDate: { type: Date },
  interviewFeedback: { type: String },
  selectionDate: { type: Date },
  interviews: [InterviewRoundSchema],
  rejectionReason: { type: String }
}, { timestamps: true });

CandidateSubmissionSchema.index({ candidateId: 1, requirementId: 1 }, { unique: true });
CandidateSubmissionSchema.index({ requirementId: 1, stage: 1 });
CandidateSubmissionSchema.index({ submittedBy: 1 });
CandidateSubmissionSchema.index({ submittedOn: -1 });

export const CandidateSubmission = model<ICandidateSubmission>('CandidateSubmission', CandidateSubmissionSchema);

// ==========================================
// 7. AUDIT LOG MODEL (With 1-Year TTL)
// ==========================================
export interface IAuditLog extends Document {
  entityName: string;
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldValues?: any;
  newValues?: any;
  changedBy?: Types.ObjectId;
  changedAt: Date;
  category?: string;
  ipAddress?: string;
  details?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entityName: { type: String, required: true },
  entityId: { type: String, required: true },
  action: { type: String, required: true, enum: ['INSERT', 'UPDATE', 'DELETE'] },
  oldValues: { type: Schema.Types.Mixed },
  newValues: { type: Schema.Types.Mixed },
  changedBy: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  changedAt: { type: Date, default: Date.now },
  category: { type: String },
  ipAddress: { type: String },
  details: { type: String }
});

AuditLogSchema.index({ changedAt: 1 }, { expireAfterSeconds: 31536000 }); // 365 days retention
AuditLogSchema.index({ entityName: 1, entityId: 1 });
AuditLogSchema.index({ changedBy: 1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);

// ==========================================
// 8. TOKEN BLACKLIST MODEL
// ==========================================
export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

const TokenBlacklistSchema = new Schema<ITokenBlacklist>({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true }
});

TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist = model<ITokenBlacklist>('TokenBlacklist', TokenBlacklistSchema);

// ==========================================
// 9. ATOMIC METRICS COUNTER HELPER SERVICE
// ==========================================
export async function updateRequirementCountersOnSubmissionChange(
  requirementId: Types.ObjectId | string,
  prevStage: string | null,
  newStage: string | null
) {
  const incDoc: Record<string, number> = {};

  if (!prevStage && newStage) {
    // New submission added
    incDoc.submissionsCount = 1;
    if (newStage === 'Interview Scheduled') incDoc.interviewsCount = 1;
    if (newStage === 'Placed' || newStage === 'Offered') incDoc.placed = 1;
  } else if (prevStage && !newStage) {
    // Submission deleted
    incDoc.submissionsCount = -1;
    if (prevStage === 'Interview Scheduled') incDoc.interviewsCount = -1;
    if (prevStage === 'Placed' || prevStage === 'Offered') incDoc.placed = -1;
  } else if (prevStage && newStage && prevStage !== newStage) {
    // Stage transition
    if (prevStage === 'Interview Scheduled') incDoc.interviewsCount = (incDoc.interviewsCount || 0) - 1;
    if (newStage === 'Interview Scheduled') incDoc.interviewsCount = (incDoc.interviewsCount || 0) + 1;

    if (prevStage === 'Placed' || prevStage === 'Offered') incDoc.placed = (incDoc.placed || 0) - 1;
    if (newStage === 'Placed' || newStage === 'Offered') incDoc.placed = (incDoc.placed || 0) + 1;
  }

  if (Object.keys(incDoc).length > 0) {
    await Requirement.findByIdAndUpdate(requirementId, { $inc: incDoc });
  }
}
```

---

## 7. MongoDB Aggregation Pipelines

### 7.1 Complete Dashboard Aggregation Pipeline (6 Facets)
```javascript
db.requirements.aggregate([
  {
    $facet: {
      // 1. Overall Metrics
      overallMetrics: [
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            totalRequirements: { $sum: 1 },
            openRequirements: {
              $sum: { $cond: [{ $eq: ['$status', 'Open'] }, 1, 0] }
            },
            totalSubmissions: { $sum: '$submissionsCount' },
            totalPlaced: { $sum: '$placed' }
          }
        }
      ],
      // 2. Status Distribution
      statusDistribution: [
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ],
      // 3. Priority Distribution
      priorityDistribution: [
        { $match: { isDeleted: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ],
      // 4. Per Recruiter Metrics
      perRecruiterMetrics: [
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$ownerId',
            requirementsCount: { $sum: 1 },
            submissionsCount: { $sum: '$submissionsCount' },
            placedCount: { $sum: '$placed' }
          }
        },
        {
          $lookup: {
            from: 'recruiters',
            localField: '_id',
            foreignField: '_id',
            as: 'recruiter'
          }
        },
        { $unwind: '$recruiter' },
        {
          $project: {
            recruiterId: '$_id',
            recruiterName: '$recruiter.name',
            requirementsCount: 1,
            submissionsCount: 1,
            placedCount: 1
          }
        }
      ],
      // 5. Recent Activity
      recentActivity: [
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: 10 },
        {
          $project: {
            reqCode: 1,
            roleTitle: 1,
            status: 1,
            priority: 1,
            createdAt: 1
          }
        }
      ],
      // 6. Daily Trends
      dailyTrends: [
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]
    }
  }
])
```

### 7.2 Optimized Recruiter Performance Pipeline
```javascript
db.candidate_submissions.aggregate([
  {
    $group: {
      _id: '$submittedBy',
      totalSubmissions: { $sum: 1 },
      interviews: {
        $sum: { $cond: [{ $eq: ['$stage', 'Interview Scheduled'] }, 1, 0] }
      },
      selections: {
        $sum: { $cond: [{ $in: ['$stage', ['Offered', 'Placed']] }, 1, 0] }
      }
    }
  },
  {
    $lookup: {
      from: 'recruiters',
      localField: '_id',
      foreignField: '_id',
      as: 'recruiter'
    }
  },
  { $unwind: '$recruiter' },
  {
    $lookup: {
      from: 'requirements',
      let: { recruiterId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$ownerId', '$$recruiterId'] },
                { $eq: ['$isDeleted', false] },
                { $not: { $in: ['$status', ['Closed', 'Rejected']] } }
              ]
            }
          }
        }
      ],
      as: 'activeRequirements'
    }
  },
  {
    $project: {
      recruiterId: '$_id',
      name: '$recruiter.name',
      email: '$recruiter.email',
      title: '$recruiter.title',
      totalSubmissions: '$totalSubmissions',
      interviews: '$interviews',
      selections: '$selections',
      activeRequirementsCount: { $size: '$activeRequirements' },
      avgDaysOpen: {
        $avg: {
          $map: {
            input: '$activeRequirements',
            as: 'req',
            in: {
              $divide: [
                { $subtract: [new Date(), '$$req.createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    }
  }
])
```

### 7.3 Replacement for `active_requirements_view`
```javascript
db.requirements.aggregate([
  {
    $match: {
      isDeleted: false,
      status: { $nin: ['Closed', 'Rejected'] }
    }
  },
  {
    $lookup: {
      from: 'recruiters',
      localField: 'ownerId',
      foreignField: '_id',
      as: 'owner'
    }
  },
  { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'clients',
      localField: 'clientId',
      foreignField: '_id',
      as: 'client'
    }
  },
  { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      id: '$_id',
      reqCode: '$reqCode',
      roleTitle: '$roleTitle',
      location: '$location',
      experience: '$experience',
      skills: '$skills',
      technologies: '$technologies',
      priority: '$priority',
      status: '$status',
      assignmentStatus: '$assignmentStatus',
      submissionsCount: '$submissionsCount',
      createdAt: '$createdAt',
      updatedAt: '$updatedAt',
      ownerName: '$owner.name',
      ownerEmail: '$owner.email',
      ownerTitle: '$owner.title',
      clientName: '$client.name'
    }
  }
])
```

### 7.4 Client Delivery Gap Analysis Pipeline
```javascript
db.clients.aggregate([
  {
    $lookup: {
      from: 'requirements',
      localField: '_id',
      foreignField: 'clientId',
      as: 'requirements'
    }
  },
  {
    $project: {
      clientName: '$name',
      totalDemands: { $size: '$requirements' },
      totalOpenings: { $sum: '$requirements.openPositions' },
      totalPlaced: { $sum: '$requirements.placed' },
      gap: {
        $subtract: [
          { $sum: '$requirements.openPositions' },
          { $sum: '$requirements.placed' }
        ]
      },
      fulfillmentRate: {
        $cond: [
          { $gt: [{ $sum: '$requirements.openPositions' }, 0] },
          {
            $multiply: [
              {
                $divide: [
                  { $sum: '$requirements.placed' },
                  { $sum: '$requirements.openPositions' }
                ]
              },
              100
            ]
          },
          0
        ]
      }
    }
  }
])
```

---

## 8. Summary of Key Design Decisions

1. **Denormalized Recruiter Assignments:** Embedding recruiter assignment arrays directly inside requirements avoids costly join tables while guaranteeing uniqueness per recruiter.
2. **Atomic Counter Collection:** Provides thread-safe, race-condition free incrementing sequence IDs (`REQ-...` and `Cand-...`).
3. **Numeric CTC in INR:** Resolves V1 string vs. decimal inconsistencies by standardizing CTC as annual numeric amounts in INR.
4. **Optimized Aggregations:** Grouping directly from `candidate_submissions` eliminates heavy per-recruiter lookups across large talent pools.
5. **Stateless Auth with `tokenVersion` & Blacklists:** Guarantees instantaneous global session invalidation on password change or logout without incurring per-request database lookups.
