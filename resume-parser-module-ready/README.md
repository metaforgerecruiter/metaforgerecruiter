# Resume Parser Module (Production Ready)

A self-contained, enterprise-grade resume parsing engine for Node.js and TypeScript. It features a dual-engine architecture:
1. **Primary AI Parsing Engine**: Powered by Google Generative AI (Gemini 3.8 Flash, with automatic multi-model fallback across Gemini 2.5 Flash, 2.0 Flash, and 1.5 Flash).
2. **Local Deterministic Fallback Parser**: A zero-external-dependency heuristic engine with regex and dictionary rules that activates automatically when Gemini API quota is exhausted, offline, or when no API key is configured.
3. **Evidence-Lock Verification**: Enforces post-extraction validation to ensure that all extracted skills, roles, experience numbers, and locations have explicit verbatim backing in the source resume document, preventing hallucinations.
4. **AI Context Chat**: Includes candidate assessment Q&A endpoint and function to evaluate candidates against job descriptions or query resumes interactively.
5. **Storage Adapters**: Includes clean persistence abstraction (`CandidateStoreAdapter`) with a default `InMemoryCandidateStore` and instructions for plugging in PostgreSQL, Prisma, MongoDB, or SQLite.

---

## Why the Source Code Package Size is ~250 KB (and Why That is Normal)

In the original full-stack repository, the folder `metaforge-resume-parser` measured ~1.56 MB. However:
- **1.137 MB** was a binary SQLite write-ahead-log (`metaforge.db-wal`).
- **67 KB** was `package-lock.json`.
- **36 KB** were SQLite database headers (`metaforge.db`, `metaforge.db-shm`).

None of those binary database files were resume parsing code. Pure, clean TypeScript source code without `node_modules` or database binaries is approximately **250 KB** (spanning ~5,000 lines of code across all parsers, regex engines, schemas, prompts, and utilities). With compiled production distributions (`dist/`), the package is ~800 KB.

---

## Architecture Overview

```
                                ┌────────────────────────┐
                                │   Uploaded Resume      │
                                │ (PDF, DOCX, DOC, TXT)  │
                                └───────────┬────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │      extractResumeText / extract.ts     │
                       │   (pdf-parse, mammoth, word-extractor)  │
                       └────────────────────┬────────────────────┘
                                            │
                        ┌───────────────────┴───────────────────┐
                        │ Is GEMINI_API_KEY set & quota valid?  │
                        └─────────┬───────────────────┬─────────┘
                                  │ YES               │ NO (or Quota 429)
                                  ▼                   ▼
                     ┌───────────────────────┐   ┌───────────────────────┐
                     │   Gemini AI Parser    │   │  Local Deterministic  │
                     │  (gemini-3.8-flash)   │   │     Regex Parser      │
                     └───────────┬───────────┘   └───────────┬───────────┘
                                 │                           │
                                 └─────────────┬─────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     applyEvidenceLock Engine     │
                              │  - Strict 10-skill cap           │
                              │  - Dedicated skills section lock │
                              │  - Professional role validation  │
                              │  - Explicit experience cleaner   │
                              │  - Location extraction & lock    │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                                 ┌────────────────────────────┐
                                 │   Normalized Output JSON   │
                                 │  (ParsedCandidateResume)   │
                                 └────────────────────────────┘
```

---

## Directory Structure

```
resume-parser-module-ready/
├── .env.example                 # Sanitized configuration template
├── .gitignore                   # Standard ignore rules
├── jest.config.js               # Jest + ts-jest configuration
├── package.json                 # Minimal dependency manifest
├── tsconfig.json                # TypeScript ES2022 compiler configuration
├── README.md                    # This documentation
├── src/
│   ├── index.ts                 # Main library public entry point
│   ├── server.ts                # Standalone Express HTTP service
│   ├── types.ts                 # TypeScript type interfaces and contracts
│   ├── metaforgeParser.ts       # Orchestrator & Evidence-Lock pipeline
│   ├── parseCoreResumeFields.ts # Deterministic regex & heuristic local parser
│   ├── skillsExtractionEngine.ts# Modular skills extraction & 10-skill cap engine
│   ├── coreTechKeywords.ts      # Dictionary of technical skills & phrases
│   ├── extractResumeText.ts     # Multi-format document text extractor & OCR
│   ├── candidateNameValidation.ts# Candidate name sanitation and header filter
│   ├── resumeFieldSanitize.ts   # Education normalizer and string cleaners
│   ├── ai/
│   │   ├── config.ts            # AI environment configuration & model fallback lists
│   │   ├── gemini.ts            # Native fetch client for Google Generative AI REST API & chat
│   │   ├── prompt.ts            # Strict extraction system prompts
│   │   ├── schema.ts            # JSON cleaning, markdown fence stripper & validator
│   │   ├── experience.ts        # Work experience duration calculator
│   │   ├── normalize.ts         # Phone and contact normalizer
│   │   ├── pdfText.ts           # PDF page layout text extractor
│   │   └── extract.ts           # Base64 and text payload preparer
│   ├── adapters/
│   │   └── candidateStoreAdapter.ts # Persistence adapter interface & InMemoryCandidateStore
│   └── routes/
│       └── resumeParserRouter.ts# Express Router for /parse, /parse/bulk, /chat, /health
├── tests/
│   ├── setup.ts                 # Test environment setup
│   ├── candidateNameValidation.test.ts
│   ├── parseCoreResumeFields.name.test.ts
│   ├── resumeFieldSanitize.test.ts
│   ├── designationExtraction.test.ts
│   ├── skillsExtractionEngine.test.ts
│   ├── strictSkillsAndExperience.test.ts
│   ├── resumeParserRouter.test.ts
│   └── documentFormatExtraction.test.ts
└── dist/                       (Compiled ES2022 JavaScript + .d.ts + .map)
    ├── index.js / index.d.ts
    ├── server.js / server.d.ts
    ├── ...
```

---

## System Requirements & Dependencies

- **Node.js**: `>= 18.0.0` (tested on Node 18, 20, 22, and 24)
- **TypeScript**: `>= 5.0.0`
- **Native Fetch**: Uses standard global `fetch` (built into Node 18+). No external `@google/generative-ai` SDK is required, keeping bundle size minimal and avoiding dependency bloat.

### Runtime Dependencies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `express` | `^4.21.2` | HTTP router adapter and standalone service |
| `cors` | `^2.8.5` | Cross-origin resource sharing middleware |
| `multer` | `^1.4.5-lts.1` | In-memory multipart file upload handling (no disk writes) |
| `pdf-parse` | `^1.1.1` | Fast PDF text and metadata extraction |
| `mammoth` | `^1.8.0` | Microsoft Word (`.docx`) text extraction |
| `word-extractor`| `^1.0.4` | Legacy Microsoft Word (`.doc`) binary extraction |
| `pdfjs-dist` | `^5.7.284` | PDF page rendering for OCR fallback |
| `tesseract.js` | `^7.0.0` | Optional OCR engine for scanned PDF and image resumes |
| `@napi-rs/canvas` | `^1.0.0` | Canvas backend for PDF OCR rendering |
| `dotenv` | `^16.4.7` | Loads environment variables from `.env` |

---

## Configuration (`.env`)

Copy `.env.example` to `.env` in the root of your application:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key. If omitted, the module operates in **100% deterministic local mode** without cloud calls. |
| `GEMINI_MODEL` | Optional | `gemini-3.8-flash` | Primary Gemini model ID (also accepts alias `GEMINI_RESUME_MODEL`). Automatically falls back on rate limits. |
| `GEMINI_FALLBACK_MODELS` | Optional | `gemini-3.5-flash-lite,gemini-3.5-flash` | Comma-separated list of fallback models if primary model hits 429 quota or rate limits. |
| `PORT` | Optional | `3001` | HTTP port when running as a standalone server. |
| `CORS_ORIGIN` | Optional | `*` | Allowed CORS origins for Express API server. |

---

## Quick Start & Integration Guide

### Option 1: Integrate as an In-Process Library (Recommended)

Import `parseResumeBuffer` directly into your existing backend controllers or worker queues:

```typescript
import fs from 'fs';
import { parseResumeBuffer, ParsedCandidateResume } from 'resume-parser-module';

async function handleCandidateUpload() {
  const fileBuffer = fs.readFileSync('path/to/resume.pdf');
  const filename = 'resume.pdf';

  // Automatically uses Gemini AI if key is set, or falls back to local parser
  const result: ParsedCandidateResume = await parseResumeBuffer(fileBuffer, filename);

  console.log('Candidate Name:', result.candidateName);
  console.log('Designation / Role:', result.technologiesRaw);
  console.log('Skills (max 10):', result.skillsRaw);
  console.log('Total Experience:', result.totalExperience);
  console.log('Location:', result.currentLocation);
  console.log('Contact Number:', result.contactNumber);
  console.log('Email:', result.email);
  console.log('Highest Qualification:', result.highestQualification);
  console.log('Parser Used:', result.parser); // 'metaforge' | 'legacy'
}
```

### Option 2: Mount as an Express Route in Your Existing API

Mount the provided `resumeParserRouter` directly into your Express application:

```typescript
import express from 'express';
import { resumeParserRouter } from 'resume-parser-module';

const app = express();
app.use(express.json());

// Mount at your desired base path
app.use('/api/candidates/resume', resumeParserRouter);

app.listen(3000, () => {
  console.log('Application running with resume parsing at /api/candidates/resume/parse');
});
```

### Option 3: Run as a Standalone Microservice

Run the included microservice server independently:

```bash
# Development mode (auto-reload)
npm run dev

# Production build and run
npm run build
npm start
```

---

## HTTP API Reference

### 1. Health & Status
- **Method**: `GET`
- **Path**: `/health` (or `/api/resume/health`)
- **Response**:
```json
{
  "status": "ok",
  "service": "resume-parser-module",
  "aiParserAvailable": true,
  "aiSuspendedNotice": null,
  "mode": "hybrid-ai-with-fallback"
}
```

### 2. Parse Single Resume
- **Method**: `POST`
- **Path**: `/parse` (or `/api/resume/parse`)
- **Content-Type**: `multipart/form-data`
- **Form Field**: `resume` (File)
- **Supported File Types**: `.pdf`, `.docx`, `.doc`, `.txt`, `.png`, `.jpg`, `.jpeg`, `.tiff`
- **Sample Response**:
```json
{
  "success": true,
  "message": "Resume parsed successfully",
  "data": {
    "candidateName": "Ananya Sharma",
    "email": "ananya.sharma@gmail.com",
    "contactNumber": "+919876543210",
    "linkedinUrl": "https://linkedin.com/in/ananyasharma",
    "highestQualification": "B.Tech in Computer Science",
    "skillsRaw": "TypeScript, React, Node.js, PostgreSQL, Docker",
    "technologiesRaw": "Full Stack Developer",
    "technologies": "Full Stack Developer",
    "role": "Full Stack Developer",
    "totalExperience": "4 years",
    "relevantExperience": null,
    "currentEmployer": null,
    "currentLocation": "Bangalore, Karnataka",
    "location": "Bangalore, Karnataka",
    "sourceFile": "candidate_resume.pdf",
    "parser": "metaforge"
  }
}
```

### 3. Bulk Resume Parsing
- **Method**: `POST`
- **Path**: `/parse/bulk` (or `/api/resume/parse/bulk`)
- **Content-Type**: `multipart/form-data`
- **Form Field**: `resumes` (Up to 5 files)

### 4. Interactive AI Candidate Q&A / Chat
- **Method**: `POST`
- **Path**: `/chat` (or `/api/resume/chat`)
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "messages": [
    { "role": "user", "content": "Does this candidate have experience with Kubernetes and CI/CD pipelines?" }
  ],
  "candidateProfile": {
    "candidateName": "Ananya Sharma",
    "skillsRaw": "TypeScript, React, Node.js, PostgreSQL, Docker, Kubernetes",
    "totalExperience": "4 years"
  }
}
```

---

## Output Data Contract (`ParsedCandidateResume`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `candidateName` | `string \| null` | Sanitized person name. Never returns resume headings (e.g. "Curriculum Vitae"). |
| `email` | `string \| null` | Validated candidate email address. |
| `contactNumber` | `string \| null` | Cleaned phone number formatted with country code (e.g. `+919876543210`). |
| `linkedinUrl` | `string \| null` | Full HTTPS URL to the candidate's LinkedIn profile. |
| `highestQualification`| `string \| null`| Standardized academic degree (e.g. `B.Tech`, `B.Com`, `MBA`). Non-academic courses and certifications are excluded. |
| `skillsRaw` | `string \| null` | Comma-separated list of **maximum 10** individual skills strictly verified against the resume's skills section. |
| `technologiesRaw` | `string \| null` | Professional designation or primary role title (e.g. `Full Stack Developer`). |
| `role` | `string \| null` | Alias of `technologiesRaw` matching candidate role. |
| `totalExperience` | `string` | Verbatim stated experience (e.g. `12 years`, `7+ years`, `4.5 years`). Qualifiers like "nearly" or "over" are stripped. |
| `relevantExperience` | `null` | Reserved for integration adapters; returns `null`. |
| `currentEmployer` | `string \| null` | Most recent company name if identified. |
| `currentLocation` | `string \| null` | Candidate's current residential location/city/state if stated. |
| `location` | `string \| null` | Alias of `currentLocation`. |
| `sourceFile` | `string` | The original uploaded filename. |
| `parser` | `'metaforge' \| 'legacy'` | Indicates whether Gemini AI (`metaforge`) or the local fallback parser (`legacy`) processed the document. |

---

## Strict Extraction Rules & Evidence Lock Guarantees

1. **Skills Extraction (Maximum 10 Skills)**:
   - Skills are extracted **only** from dedicated skills headings (`Skills`, `Technical Skills`, `Key Skills`, `Core Competencies`, `Tools & Technologies`, etc.).
   - Responsibilities, job duties, project narratives, certificates, and soft skill phrases are strictly excluded.
   - Compound phrases (e.g., `AutoCAD, SolidWorks, CATIA`) are expanded into distinct individual items.
   - Output is strictly capped at **10 unique, deduplicated skills**.
2. **Designation & Role Priority**:
   - The `technologies` / `role` field extracts the professional title using a 4-tier priority hierarchy:
     1. Dedicated Professional Summary / Profile statement.
     2. Resume headline immediately adjacent to the candidate's name.
     3. Explicit employment history designation (e.g. `Designation: Senior Data Engineer`).
     4. `null` if no explicit designation exists (skills are never substituted as the role).
3. **Experience Calculation**:
   - Explicitly stated total experience (e.g. `Over 7 years` -> `7 years`, `7+ years` -> `7+ years`) takes absolute priority over date range arithmetic.
   - If no explicit total duration is declared, returns `""` rather than guessing or fabricating.
4. **Location Extraction**:
   - Labeled location entries (`Current Location: ...`, `Location: ...`, `Based in: ...`) and City, State patterns are extracted and validated.
5. **Evidence Lock**:
   - Even when Gemini AI parses a document, `applyEvidenceLock` validates the AI output against the original extracted text. Any hallucinated skill, location, or designation without text evidence is discarded.

---

## Testing & Verification

The package includes 8 complete test suites with 153 test cases covering all edge cases, regression guarantees, document formats, and HTTP endpoints:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Suite Summary
- `tests/candidateNameValidation.test.ts`: Verifies rejection of section headers mistaken for names.
- `tests/parseCoreResumeFields.name.test.ts`: Header suppression and name precedence tests.
- `tests/resumeFieldSanitize.test.ts`: Degree compaction and job role phrase detection.
- `tests/designationExtraction.test.ts`: 4-tier designation priority and bulk candidate isolation.
- `tests/skillsExtractionEngine.test.ts`: Complex table layouts, two-column formats, compound expansion, and strict 10-skill cap.
- `tests/strictSkillsAndExperience.test.ts`: Comprehensive experience string parser and qualifier cleaners.
- `tests/resumeParserRouter.test.ts`: End-to-end integration tests for Express routes and file uploads.
- `tests/documentFormatExtraction.test.ts`: Multi-format text processing, location preservation, and candidate storage adapter tests.

---

## Clean Architecture & Portability

- **Zero Database Lock-In**: The module has no mandatory database dependencies. An optional `CandidateStoreAdapter` is provided for applications wishing to persist parsed records.
- **Zero Authentication Lock-In**: The parsing engine is completely decoupled from JWT, session, or project-specific auth middleware.
- **Self-Contained AI Client**: Built with native HTTPS `fetch`, requiring no external cloud SDK dependencies.
- **Safe For Integration**: Can be safely dropped into any existing TypeScript, JavaScript, Express, NestJS, Fastify, or serverless project.
