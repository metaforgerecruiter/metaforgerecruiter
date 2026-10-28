# MetaForge Recruiter Application V2 — Realistic Document Examples

**Document ID:** `docs/database/09L_Example_Documents.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Collection Document Examples

### 1.1 `users`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d5e1" },
  "userId": "USR-10004",
  "name": "Marcus Chen",
  "email": "m.chen@talentflow.io",
  "passwordHash": "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$R29vZFBhc3N3b3JkMTIz!",
  "role": "recruiter",
  "teamId": { "$oid": "66f1a8b1e4b0a1a2b3c4d500" },
  "active": true,
  "capabilities": {
    "addCandidates": true,
    "submitToClients": false,
    "scheduleInterviews": true,
    "exportReportsCsv": false,
    "reassignRequirements": false
  },
  "lastLoginAt": "2026-09-22T08:30:00.000Z",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-09-22T08:30:00.000Z"
}
```

---

### 1.2 `clients`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d501" },
  "clientId": "CLI-1001",
  "clientName": "Accenture",
  "domain": "Information Technology",
  "tier": "Tier-1",
  "status": "Active",
  "slaDays": 5,
  "pocContacts": [
    {
      "name": "Sarah Jenkins",
      "email": "client@accenture.com",
      "phone": "+1 (555) 234-5678",
      "designation": "VP of Talent Acquisition"
    }
  ],
  "accountLeadId": { "$oid": "66f1a8b1e4b0a1a2b3c4d503" },
  "deliveryGapScore": 94.5,
  "createdAt": "2026-01-10T09:00:00.000Z"
}
```

---

### 1.3 `requirements`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d502" },
  "reqCode": "REQ-2026-08-12-001",
  "title": "Senior React / Node Fullstack Engineer",
  "clientId": { "$oid": "66f1a8b1e4b0a1a2b3c4d501" },
  "clientName": "Accenture",
  "priority": "High",
  "status": "Open",
  "assignmentStatus": "Assigned",
  "openings": 5,
  "placedCount": 1,
  "budgetRange": {
    "min": 18.0,
    "max": 24.0,
    "currency": "INR"
  },
  "assignedLeadId": { "$oid": "66f1a8b1e4b0a1a2b3c4d503" },
  "assignedRecruiterIds": [{ "$oid": "66f1a8b1e4b0a1a2b3c4d5e1" }],
  "skillsRequired": ["React", "Node.js", "TypeScript", "MongoDB", "Tailwind CSS"],
  "experienceRange": { "min": 5.0, "max": 8.0 },
  "location": "Bengaluru (Hybrid)",
  "emailArrivedTime": "2026-08-12T04:30:00.000Z",
  "revokeRequested": false,
  "createdAt": "2026-08-12T05:00:00.000Z"
}
```

---

### 1.4 `candidates`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d504" },
  "candidateId": "CAND-18012",
  "name": "Priya Sharma",
  "email": "priya.sharma@example.com",
  "phone": "+91 98765 43210",
  "linkedInUrl": "https://linkedin.com/in/priya-sharma-dev",
  "currentCompany": "Tata Consultancy Services",
  "qualification": "B.Tech Computer Science",
  "totalExperienceYears": 6.5,
  "relevantExperienceYears": 5.0,
  "currentCtc": 14.5,
  "expectedCtc": 20.0,
  "noticePeriodDays": 30,
  "currentLocation": "Bengaluru",
  "preferredLocation": "Bengaluru",
  "offerInHand": "In Pipeline",
  "skills": ["React", "Node.js", "TypeScript", "Redux", "PostgreSQL"],
  "resumeFileId": { "$oid": "66f1a8b1e4b0a1a2b3c4d599" },
  "sourcedByRecruiterId": { "$oid": "66f1a8b1e4b0a1a2b3c4d5e1" },
  "status": "Submitted",
  "createdAt": "2026-08-14T11:20:00.000Z"
}
```

---

### 1.5 `submissions`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d505" },
  "submissionId": "SUB-90123",
  "candidateId": { "$oid": "66f1a8b1e4b0a1a2b3c4d504" },
  "requirementId": { "$oid": "66f1a8b1e4b0a1a2b3c4d502" },
  "clientId": { "$oid": "66f1a8b1e4b0a1a2b3c4d501" },
  "recruiterId": { "$oid": "66f1a8b1e4b0a1a2b3c4d5e1" },
  "leadId": { "$oid": "66f1a8b1e4b0a1a2b3c4d503" },
  "stage": "Submitted to Client",
  "leadApprovalStatus": "Approved",
  "matchScore": 92.5,
  "submittedAt": "2026-08-14T12:00:00.000Z",
  "leadApprovedAt": "2026-08-14T14:30:00.000Z",
  "clientForwardedAt": "2026-08-15T09:15:00.000Z",
  "updatedAt": "2026-08-15T09:15:00.000Z"
}
```

---

### 1.6 `interviews`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d506" },
  "interviewId": "INT-40501",
  "submissionId": { "$oid": "66f1a8b1e4b0a1a2b3c4d505" },
  "candidateId": { "$oid": "66f1a8b1e4b0a1a2b3c4d504" },
  "requirementId": { "$oid": "66f1a8b1e4b0a1a2b3c4d502" },
  "round": "L1 Technical",
  "dateTime": "2026-08-18T10:00:00.000Z",
  "mode": "Online",
  "meetingUrl": "https://meet.google.com/abc-defg-hij",
  "interviewerName": "Vikram Seth (Accenture Lead Tech)",
  "interviewerEmail": "v.seth@accenture.com",
  "status": "Passed",
  "reminderSent": true,
  "createdAt": "2026-08-15T10:00:00.000Z"
}
```

---

### 1.7 `activity_logs`
```json
{
  "_id": { "$oid": "66f1a8b1e4b0a1a2b3c4d507" },
  "timestamp": "2026-08-15T09:15:00.000Z",
  "userId": { "$oid": "66f1a8b1e4b0a1a2b3c4d503" },
  "userName": "Harish Gadipally",
  "userEmail": "harish.g@metaforgeit.com",
  "userRole": "lead",
  "action": "Approved and Forwarded Candidate Priya Sharma to Client Accenture",
  "category": "Submissions",
  "targetEntity": "Submission",
  "targetId": "SUB-90123",
  "clientName": "Accenture",
  "ipAddress": "103.42.18.5",
  "status": "Success",
  "details": {
    "previousStage": "Submitted to Lead",
    "newStage": "Submitted to Client"
  }
}
```
