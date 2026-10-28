# MetaForge Recruiter Application V2 — AI Engine Data Architecture

**Document ID:** `docs/database/09H_AI_Data_Architecture.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. AI Processing Lifecycle & Non-Overwrite Rule

The AI Engine processes candidate resumes, extracts structured metadata, and calculates JD-Resume match scores.

### CRITICAL RULE
**AI output MUST NEVER overwrite original human-verified source data.**
Parsed entities reside in dedicated operational collections (`ai_parsing_jobs` and `ai_match_scores`). Human recruiters retain the ability to edit candidate skills and experience without destroying the AI's original parsed snapshot.

```
┌─────────────────────────┐
│ Upload Candidate Resume │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ Save Original Resume    │ ──> `file_metadata` (Source of Truth)
└────────────┬────────────┘
             │ Async Event
┌────────────▼────────────┐
│ Enqueue AI Parse Job    │ ──> `ai_parsing_jobs` (Status: PENDING)
└────────────┬────────────┘
             │ Process via mammoth / LLM Gateway
┌────────────▼────────────┐
│ AI Extracted Snapshot   │ ──> Stores parsed JSON, confidence score, model version
└────────────┬────────────┘
             │ Populate Candidate Profile
┌────────────▼────────────┐
│ Candidates Collection   │ ──> Recruiter can review & manually override profile fields
└─────────────────────────┘
```

---

## 2. Collection Schemas: AI Engine

### 2.1 Collection: `ai_parsing_jobs`

```typescript
export interface AIParsingJobDocument {
  _id: ObjectId;
  jobId: string;                // Unique Job UUID
  sourceFileId: ObjectId;       // Ref to `file_metadata._id`
  candidateId?: ObjectId;       // Ref to `candidates._id`
  parserEngine: string;         // 'mammoth-v1' | 'openai-gpt4o' | 'claude-3.5-sonnet'
  promptVersion: string;        // e.g. "v2.4.1"
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rawTextExtracted?: string;    // Full unparsed text
  extractedData?: {
    name?: string;
    email?: string;
    phone?: string;
    skills?: string[];
    totalExperienceYears?: number;
    education?: Array<{ degree: string; institution: string; year?: number }>;
    workHistory?: Array<{ company: string; role: string; durationYears?: number }>;
  };
  confidenceScore: number;      // 0.00 to 1.00
  retryCount: number;           // Default 0, Max 3
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
```

### 2.2 Collection: `ai_match_scores`

```typescript
export interface AIMatchScoreDocument {
  _id: ObjectId;
  candidateId: ObjectId;        // Ref to candidate
  requirementId: ObjectId;      // Ref to requirement
  submissionId?: ObjectId;      // Ref to submission
  overallMatchScore: number;    // e.g. 92.5 (Percentage)
  skillMatchPercentage: number; // e.g. 88.0
  experienceMatchPercentage: number;
  matchingSkills: string[];     // Skills candidate possesses that JD requires
  missingSkills: string[];      // Required skills candidate lacks
  summaryEvaluation: string;    // AI qualitative summary bullet points
  vectorEmbedding?: number[];   // 1536-dim vector array for MongoDB Vector Search
  computedAt: Date;
}
```

---

## 3. MongoDB Vector Search Support (Semantic Search)

To support natural language candidate matching ("Find senior DevOps engineers with AWS and Kubernetes experience"), `ai_match_scores` and `candidates` support vector indexing:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "vectorEmbedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "currentLocation"
    }
  ]
}
```
