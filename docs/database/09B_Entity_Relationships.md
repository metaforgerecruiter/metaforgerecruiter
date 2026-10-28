# MetaForge Recruiter Application V2 — Entity Relationships & Diagrams

**Document ID:** `docs/database/09B_Entity_Relationships.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. High-Level Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ TEAMS : "belongs_to"
    ROLES_PERMISSIONS ||--o{ USERS : "defines_role_for"
    CLIENTS ||--o{ REQUIREMENTS : "issues"
    USERS ||--o{ REQUIREMENTS : "lead_assigned_to"
    USERS }|--|{ REQUIREMENTS : "recruiters_assigned_to"
    
    CANDIDATES ||--o{ SUBMISSIONS : "submitted_in"
    REQUIREMENTS ||--o{ SUBMISSIONS : "receives"
    USERS ||--o{ SUBMISSIONS : "submitted_by"
    
    SUBMISSIONS ||--o{ INTERVIEWS : "scheduled_for"
    SUBMISSIONS ||--o| OFFERS : "progresses_to"
    INTERVIEWS ||--o{ INTERVIEW_FEEDBACKS : "produces"
    
    CANDIDATES ||--o{ CANDIDATE_DOCUMENTS : "has"
    FILE_METADATA ||--o| CANDIDATE_DOCUMENTS : "stores_file_for"
    
    SUBMISSIONS ||--o| AI_MATCH_SCORES : "analyzed_by"
    CANDIDATE_DOCUMENTS ||--o| AI_PARSING_JOBS : "processed_by"
    
    USERS ||--o{ activity_logs : "performed_by"
```

---

## 2. Recruitment Lifecycle Data Model

```mermaid
graph TD
    A[Client Demand Received] -->|Create Requirement| REQ[Requirements Collection]
    REQ -->|Assign Team Lead & Recruiters| REQ_ASSIGN[Requirement History]
    
    CAND[Candidates Collection] -->|Upload Resume / Parse| AI_JOB[AI Parsing Job]
    AI_JOB -->|Extract Skills & CTC| CAND
    
    CAND -->|Submit Candidate to Req| SUB[Submissions Collection]
    REQ -->|Links Requirement| SUB
    
    SUB -->|Recruiter Submits to Lead| SUB_LEAD[Stage: Submitted to Lead]
    SUB_LEAD -->|Lead Approves| SUB_CLIENT[Stage: Submitted to Client]
    SUB_LEAD -->|Lead Rejects| SUB_REJ[Stage: Rejected]
    
    SUB_CLIENT -->|Client Invites Interview| INT[Interviews Collection]
    INT -->|Schedule Round 1 / L1| INT_L1[L1 Technical Round]
    INT_L1 -->|Evaluator Feedback| INT_FB[Interview Feedbacks]
    
    INT_FB -->|Passed| INT_L2[L2 / Client Round]
    INT_L2 -->|Passed| OFR[Offers Collection]
    INT_FB -->|Rejected| SUB_REJ
    
    OFR -->|Offer Released| ONB[Onboarding Track]
    ONB -->|Candidate Joined| JOINED[Status: Joined / Placed]
    ONB -->|Backed Out| DECLINED[Status: Not Joined]
```

---

## 3. RBAC & Data Ownership Hierarchy

```mermaid
graph TB
    SA[Super Admin User] -->|Global Access| ALL[All Collections]
    AD[Admin User] -->|Governance Access| GOV[Users, Clients, Requirements, Reports]
    TL[Team Lead User] -->|Team Scope| TEAM[Team Requirements, Team Recruiters, Team Submissions]
    REC[Recruiter User] -->|Self Scope| OWN[Assigned Requirements, Own Candidates, Own Submissions]
    CLI[Client User] -->|Client Scope| CLIENT_DATA[Own Requirements, Candidate Submissions for Client]
```

---

## 4. Key Reference Mappings Matrix

The following table summarizes foreign key references, cardinality, and cascade strategies:

| Source Collection | Target Collection | Field Name | Cardinality | Cascade / Constraint Strategy |
|---|---|---|---|---|
| `users` | `teams` | `teamId` | Many-to-One | Restrict Delete (Cannot delete team with active users) |
| `requirements` | `clients` | `clientId` | Many-to-One | Restrict Delete (Cannot delete client with active requirements) |
| `requirements` | `users` | `assignedLeadId` | Many-to-One | Set Null on User Deactivation |
| `requirements` | `users` | `assignedRecruiterIds` | Many-to-Many | Pull array element on Recruiter Deassignment |
| `submissions` | `candidates` | `candidateId` | Many-to-One | Restrict Delete (Preserve candidate history) |
| `submissions` | `requirements` | `requirementId` | Many-to-One | Restrict Delete (Preserve requirement pipeline) |
| `submissions` | `users` | `recruiterId` | Many-to-One | Preserve ID for Recruiter Performance Audit |
| `interviews` | `submissions` | `submissionId` | Many-to-One | Cascade Delete optional / Soft-cancel interview |
| `offers` | `submissions` | `submissionId` | One-to-One | Unique index constraint on `submissionId` |
| `candidate_documents` | `file_metadata` | `fileId` | One-to-One | Sync delete on document removal |
| `ai_match_scores` | `submissions` | `submissionId` | One-to-One | Auto-recalculate on candidate resume update |
