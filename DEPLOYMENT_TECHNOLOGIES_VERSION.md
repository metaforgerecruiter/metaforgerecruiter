# Current & Actual Technologies Version Document
**Application:** MetaForge Recruiter Application Platform (MRAP) V2  
**Purpose:** Exact, Verified Production & Deployment Version Baseline

---

## 1. Core Infrastructure & Database

| Technology | Actual Installed Version | Verified From |
| :--- | :--- | :--- |
| **MongoDB Server** | **8.3.9** | `mongod --version` (Running locally on port 27017) |
| **MongoDB Node Driver** | **6.21.0** | `backend/package-lock.json` |
| **Mongoose ODM** | **8.24.4** | `backend/package-lock.json` |
| **migrate-mongo** | **11.0.0** | `backend/package-lock.json` |
| **ioredis** | **5.11.1** | `backend/package-lock.json` |

---

## 2. Runtimes & Languages

| Technology | Actual Installed Version | Verified From |
| :--- | :--- | :--- |
| **Node.js** | **24.19.0** | `node -v` (Active running host runtime) |
| **npm** | **11.17.0** | `npm -v` |
| **Python** | **3.12.10** | `python --version` |
| **TypeScript** | **5.9.3** | `frontend/package-lock.json` & `backend/package-lock.json` |

---

## 3. Frontend Technology Stack (`frontend/`)

| Technology / Package | Actual Installed Version | Verified From |
| :--- | :--- | :--- |
| **Next.js** | **15.5.25** | `frontend/package-lock.json` |
| **React** | **19.3.0** | `frontend/package-lock.json` |
| **React DOM** | **19.3.0** | `frontend/package-lock.json` |
| **Tailwind CSS** | **4.3.3** | `frontend/package-lock.json` |
| **@tailwindcss/postcss** | **4.3.3** | `frontend/package-lock.json` |
| **Lucide React** | **1.47.0** | `frontend/package-lock.json` |
| **Recharts** | **3.10.1** | `frontend/package-lock.json` |
| **Plotly.js Dist** | **3.7.0** | `frontend/package-lock.json` |
| **react-plotly.js** | **4.1.0** | `frontend/package-lock.json` |
| **mammoth** | **1.12.3** | `frontend/package-lock.json` |
| **docx** | **9.7.1** | `frontend/package-lock.json` |
| **jszip** | **3.10.2** | `frontend/package-lock.json` |

---

## 4. Backend Technology Stack (`backend/`)

| Technology / Package | Actual Installed Version | Verified From |
| :--- | :--- | :--- |
| **NestJS Core (`@nestjs/core`)** | **10.4.22** | `backend/package-lock.json` |
| **NestJS Common (`@nestjs/common`)** | **10.4.22** | `backend/package-lock.json` |
| **NestJS Platform Express** | **10.4.22** | `backend/package-lock.json` |
| **NestJS Config (`@nestjs/config`)** | **3.3.0** | `backend/package-lock.json` |
| **NestJS Mongoose (`@nestjs/mongoose`)** | **10.1.0** | `backend/package-lock.json` |
| **NestJS JWT (`@nestjs/jwt`)** | **10.2.0** | `backend/package-lock.json` |
| **NestJS Passport (`@nestjs/passport`)** | **10.0.3** | `backend/package-lock.json` |
| **Express** | **4.17.25** | `backend/package-lock.json` |
| **Mongoose** | **8.24.4** | `backend/package-lock.json` |
| **bcryptjs** | **3.0.3** | `backend/package-lock.json` |
| **passport** | **0.7.0** | `backend/package-lock.json` |
| **passport-jwt** | **4.0.1** | `backend/package-lock.json` |
| **class-validator** | **0.14.4** | `backend/package-lock.json` |
| **class-transformer** | **0.5.1** | `backend/package-lock.json` |
| **reflect-metadata** | **0.2.2** | `backend/package-lock.json` |
| **RxJS** | **7.8.2** | `backend/package-lock.json` |
| **Nodemailer** | **10.0.14** | `backend/package-lock.json` |
| **ts-node** | **10.9.2** | `backend/package-lock.json` |

---

## 5. Resume Parser Module (`resume-parser-module-ready/`)

| Technology / Package | Actual Installed Version | Verified From |
| :--- | :--- | :--- |
| **Express** | **4.22.3** | `resume-parser-module-ready/package-lock.json` |
| **Multer** | **1.4.5-lts.2** | `resume-parser-module-ready/package-lock.json` |
| **mammoth** | **1.13.0** | `resume-parser-module-ready/package-lock.json` |
| **word-extractor** | **1.0.4** | `resume-parser-module-ready/package-lock.json` |
| **pdf-parse** | **1.1.4** | `resume-parser-module-ready/package-lock.json` |
| **pdfjs-dist** | **5.7.284** | `resume-parser-module-ready/package-lock.json` |
| **@napi-rs/canvas** | **1.0.11** | `resume-parser-module-ready/package-lock.json` |
| **tesseract.js** | **7.0.0** | `resume-parser-module-ready/package-lock.json` |
| **cors** | **2.8.6** | `resume-parser-module-ready/package-lock.json` |
| **dotenv** | **16.6.1** | `resume-parser-module-ready/package-lock.json` |
| **Jest** | **29.7.0** | `resume-parser-module-ready/package-lock.json` |
| **tsx** | **4.23.15** | `resume-parser-module-ready/package-lock.json` |

---

## 6. Ports Configuration (Active)

| Component | Port |
| :--- | :--- |
| **Frontend Application** | **3000** |
| **Backend API** | **3001** |
| **AI Gateway Service** | **3002** |
| **MongoDB Database** | **27017** |
