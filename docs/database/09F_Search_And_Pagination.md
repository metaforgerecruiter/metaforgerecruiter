# MetaForge Recruiter Application V2 — Search & Pagination Architecture

**Document ID:** `docs/database/09F_Search_And_Pagination.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Search Architecture Overview

MetaForge Recruiter V2 utilizes a **Tri-Tier Search Strategy** depending on query specificity and UI component requirements:

```
                          ┌───────────────────────────────────────────────┐
                          │            User Search Interface              │
                          └───────────────────────┬───────────────────────┘
                                                  │
         ┌────────────────────────────────────────┼────────────────────────────────────────┐
         │                                        │                                        │
┌────────▼─────────┐                    ┌─────────▼────────┐                    ┌──────────▼─────────┐
│ Structured Filter│                    │ Full-Text Search │                    │ Semantic AI Search │
│ (Mongoose Match) │                    │ (MongoDB Text)   │                    │ (Vector Embedding) │
└────────┬─────────┘                    └─────────┬────────┘                    └──────────┬─────────┘
         │                                        │                                        │
 • Status = 'Open'                        • Candidate Skills                      • Match score ranking
 • Client = 'Accenture'                   • Resume text keywords                  • Skill similarity
 • Experience: 3 to 7 YOE                 • Job Demand Titles                     • Candidate-JD fit
```

---

## 2. Structured vs Full-Text Search Implementation

### 2.1 Structured Query Pipeline (Fast Index Execution)
Used for data tables with specific dropdown filters (Requirements, Submissions, Clients):

```typescript
// Mongoose Structured Filter Builder
export function buildCandidateFilterQuery(dto: CandidateSearchDto): FilterQuery<CandidateDocument> {
  const query: FilterQuery<CandidateDocument> = {};

  if (dto.minExperience || dto.maxExperience) {
    query.totalExperienceYears = {};
    if (dto.minExperience) query.totalExperienceYears.$gte = dto.minExperience;
    if (dto.maxExperience) query.totalExperienceYears.$lte = dto.maxExperience;
  }

  if (dto.noticePeriodDays) {
    query.noticePeriodDays = { $lte: dto.noticePeriodDays };
  }

  if (dto.skills && dto.skills.length > 0) {
    query.skills = { $all: dto.skills }; // Multikey index match
  }

  if (dto.currentLocation) {
    query.currentLocation = new RegExp(`^${dto.currentLocation}$`, 'i');
  }

  return query;
}
```

### 2.2 Text Search Pipeline (MongoDB `$text` Index)
Used for keyword search inputs in Candidate Repository and Requirement Search:

```typescript
// Candidate Keyword Search Query
const candidates = await this.candidateModel.find(
  { $text: { $search: keyword } },
  { score: { $meta: 'textScore' } }
)
.sort({ score: { $meta: 'textScore' } })
.limit(50)
.exec();
```

---

## 3. Pagination Strategy Architecture

MetaForge V2 combines **Cursor-based Pagination** (for high-volume streaming endpoints like Candidates and Audit Logs) with **Offset-based Pagination** (for traditional UI page number footers like Requirements and Submissions tables).

| Collection / View | Pagination Type | Sort Keys | Rationale | Page Size Defaults |
|---|---|---|---|---|
| **Candidate Repository** | Cursor Pagination | `_id`, `createdAt` | High cardinality (100k+ candidates); avoids expensive `$skip` offsets | 20 / 50 items |
| **Requirements Table** | Offset Pagination | `createdAt`, `priority` | Exact page numbers (Page 1, 2, 3...) required by UI footer | 10 / 25 items |
| **Submissions Table** | Offset Pagination | `submittedAt`, `stage` | Low-to-medium cardinality per user scope | 10 / 25 items |
| **Interview Scheduler** | Offset Pagination | `dateTime` | Calendar date bound queries | 10 / 25 items |
| **Activity Logs** | Cursor Pagination | `_id`, `timestamp` | Append-only logs; fast infinite scrolling / loading | 50 / 100 items |

---

## 4. Cursor Pagination Code Specification

```typescript
// Implementation of Cursor Pagination for Candidate Repository
export async function getPaginatedCandidates(
  model: Model<CandidateDocument>,
  filter: FilterQuery<CandidateDocument>,
  cursor?: string,
  limit: number = 20
) {
  const query = { ...filter };
  
  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) }; // Descending pagination
  }

  const results = await model.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1) // Fetch 1 extra to check if next page exists
    .exec();

  const hasNextPage = results.length > limit;
  const items = hasNextPage ? results.slice(0, limit) : results;
  const nextCursor = hasNextPage ? items[items.length - 1]._id.toString() : null;

  return {
    items,
    nextCursor,
    hasNextPage
  };
}
```
