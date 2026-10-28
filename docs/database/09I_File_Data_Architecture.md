# MetaForge Recruiter Application V2 — File & Document Data Architecture

**Document ID:** `docs/database/09I_File_Data_Architecture.md`  
**Application:** MetaForge Recruiter Application (Version 2)  
**Target Stack:** NestJS + Mongoose (v8+) + MongoDB (v7+)  

---

## 1. Hybrid Storage Architecture

MetaForge Recruiter V2 uses a **Hybrid Storage Strategy**: Large binary files (resumes, MSA agreements, offer letter PDFs) are stored in **S3-compatible Object Storage**, while rich searchable file metadata is managed in MongoDB.

```
┌─────────────────────────────────┐
│     Client Upload (Resume PDF)  │
└────────────────┬────────────────┘
                 │
 ┌───────────────┴───────────────┐
 │                               │
┌▼──────────────────────────────┐┌▼──────────────────────────────┐
│  S3 / MinIO Object Storage    ││ MongoDB `file_metadata`      │
│  Bucket: `mrap-documents`     ││ Stores: fileId, storageKey,  │
│  Key: `resumes/2026/08/x.pdf` ││ size, checksum, mimeType     │
└───────────────────────────────┘└──────────────────────────────┘
```

---

## 2. Collection Schema: `file_metadata`

```typescript
export interface FileMetadataDocument {
  _id: ObjectId;
  fileId: string;               // Unique File UUID (FIL-XXXXX)
  originalName: string;         // e.g. "Marcus_Chen_Resume_2026.pdf"
  mimeType: string;             // "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  sizeBytes: number;            // File size in bytes
  storageProvider: 'S3' | 'LOCAL' | 'MINIO';
  bucketName: string;           // Target S3 bucket
  storageKey: string;           // Unique object storage key
  checksumSha256: string;       // File integrity hash
  scanStatus: 'CLEAN' | 'INFECTED' | 'PENDING';
  uploadedBy: ObjectId;         // Ref to user who uploaded file
  uploadedAt: Date;
}
```

---

## 3. Collection Schema: `candidate_documents`

```typescript
export interface CandidateDocumentRecord {
  _id: ObjectId;
  candidateId: ObjectId;        // Ref to candidate
  documentType: 'Resume' | 'Offer Letter' | 'Government ID' | 'Degree Certificate' | 'Payslip';
  fileMetadataId: ObjectId;    // Ref to file_metadata
  isPrimaryResume: boolean;     // Flag for default active resume
  createdAt: Date;
}
```
