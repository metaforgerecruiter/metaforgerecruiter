# MetaForge Recruiter Application V2 — Migration Strategy & Versioning

**Document ID:** `docs/database/09K_Migration_Strategy.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Zero-Downtime Migration Architecture

To safely evolve MongoDB schemas in NestJS + Mongoose without service disruption, MetaForge Recruiter V2 follows a **Expand-and-Contract Migration Policy**:

```
Phase 1: EXPAND  ──> Add new optional fields or collection schemas to MongoDB.
Phase 2: DUAL-WRITE ──> Application writes to both old and new data fields.
Phase 3: BACKFILL ──> Background script migrates legacy documents to new structure.
Phase 4: READ-NEW ──> Application switches reading strictly to new fields.
Phase 5: CONTRACT ──> Safely drop legacy fields or indexes.
```

---

## 2. Database Migration Framework (`migrate-mongo`)

Migrations are version-controlled using `migrate-mongo` integrated into NestJS boot CLI:

```
backend/src/database/migrations/
├── 20260922000001_bootstrap_initial_collections.ts
├── 20260922000002_create_core_indexes.ts
├── 20260922000003_seed_rbac_roles_permissions.ts
└── 20260922000004_add_vector_embeddings_index.ts
```

### Migration Script Specification Example

```typescript
// 20260922000002_create_core_indexes.ts
import { Db } from 'mongodb';

export const up = async (db: Db) => {
  // Create Requirements Indexes
  await db.collection('requirements').createIndex({ reqCode: 1 }, { unique: true });
  await db.collection('requirements').createIndex({ status: 1, clientId: 1, createdAt: -1 });

  // Create Submissions Unique Compound Index
  await db.collection('submissions').createIndex(
    { candidateId: 1, requirementId: 1 },
    { unique: true }
  );
};

export const down = async (db: Db) => {
  await db.collection('requirements').dropIndex('reqCode_1');
  await db.collection('requirements').dropIndex('status_1_clientId_1_createdAt_-1');
  await db.collection('submissions').dropIndex('candidateId_1_requirementId_1');
};
```
