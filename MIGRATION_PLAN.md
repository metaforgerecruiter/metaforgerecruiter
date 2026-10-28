# MRAP Architecture Migration Plan

**Status:** Analysis complete — implementation proceeds incrementally  
**Source of truth:** `Recruiter-Application-V2/` (Vite + React SPA)  
**Constraint:** Migration of technical architecture only. UI, workflows, roles, permissions, and business behavior MUST remain unchanged.

---

## 1. Current Architecture

The application is a **Next.js 15 SPA shell** plus a **NestJS V2 API** on MongoDB. The UI still hydrates from mock data when the API is down. Auth prefers JWT login and falls back to demo accounts only if the backend is unreachable.

| Layer | Current implementation |
|---|---|
| Runtime | Next.js 15 + React 19 + TypeScript (SPA in `frontend/`) |
| API | NestJS 10 on `http://localhost:3001/api/v1` |
| Database | MongoDB (`metaforge_recruiter_v2`) — 23 Mongoose collections |
| Cache / jobs | Optional Redis + `workers/` (in-process fallback if Redis is down) |
| Auth | JWT (`/auth/login`) with demo seed users |
| AI | Isolated `ai-service` gateway; backend falls back to heuristic parse |

### 1.1 Folder structure (source)

```
Recruiter-Application-V2/
  src/
    App.tsx                         # Auth screens + app shell + global entity state
    main.tsx                        # Vite entry + ErrorBoundary
    index.css                       # Tailwind 4 + Inter font
    types/index.ts                  # Role, Requirement, Submission, Interview, Candidate, ...
    theme/index.ts                  # brand / roleTheme tokens
    config/navigation.ts            # ROLE_NAV per role (source of sidebar)
    data/
      mockData.ts                   # Seed entities + DEMO_ACCOUNTS
      authService.ts                # authenticate(), password policy, OTP helper
      submissionsStore.ts           # localStorage submissions + duplicate check
      savedDraftsStore.ts           # candidate/requirement drafts
      forwardRequestsStore.ts       # lead approval of client-forward requests
    components/
      auth/                         # Landing, sign-in, role portals, recovery
      landing/
      layout/                       # Sidebar, Topbar, PageHeader, PageContainer
      dashboards/                   # Recruiter, Lead, DevTeam, Client, PremiumReports
      pages/                        # All operational modules
      modals/
      ui/                           # Charts, tables, command palette, notifications
      wireframe/                    # Generic panel/table kit
      common/                       # MetaforgeLogo
    utils/screenTimeTracker.ts
  public/                           # logos
  documents/MRAP_API_Integration_and_Endpoint_Documentation.md
```

There are **no** `hooks/`, `services/` (HTTP), or `store/` folders today.

### 1.2 Auth screens (preserved)

`AuthScreen`: `landing` → `signin` / `signup` / `password-recovery` / `role-select` → `role-login` / `forgot` → `app`

Demo accounts (passwords remain the same for local seed; they will be **hashed** in MongoDB):

| Role | Email | Password |
|---|---|---|
| superadmin | r.haines@talentflow.io | Admin@2026 |
| admin | d.park@talentflow.io | Admin@2026 |
| lead | harish.g@metaforgeit.com | Lead@2026 |
| recruiter | m.chen@talentflow.io | Rec@2026 |
| devteam | dev.team@talentflow.io | Dev@2026 |
| client | client@accenture.com | Client@2026 |

The product brief lists 4 modules (Super Admin, Admin, Team Lead, Recruiter). The **running app also has `devteam` and `client`**. Those roles and their nav/pages are **kept**. They are not removed.

### 1.3 Role navigation (must not change)

Defined in `src/config/navigation.ts` → `ROLE_NAV`:

- **Super Admin:** Requirements, Add Candidates, Submissions, User Management, Clients, Interview Scheduler, Reports
- **Admin:** Requirements, Add Candidates, Submissions, Clients, Interview Scheduler, Reports
- **Team Lead:** Requirements, My Workspace, Add Candidates, Total Submissions, Interview Tracker, Daily Reports
- **Recruiter:** My Workspace, Requirements, Add Candidates, Total Submissions, Interview Tracking, Reports
- **Dev Team:** Super-admin-like + History + Audit Logs
- **Client:** My Requirements, Candidate Submissions, Interview Feedback

Universal (all roles): Notifications, AI Assistant, Profile Settings (via `UNIVERSAL_NAV`).

Default landing after login (existing `App.tsx` rule): Super Admin / Admin / Lead / Dev Team → **Requirements**; Recruiter → **Dashboard**.

### 1.4 Existing permission model (must be enforced on API)

From `UserManagementPage.tsx` / `RolesPermissionsPage.tsx`:

| Permission key | Super Admin | Admin | Team Lead | Recruiter |
|---|---|---|---|---|
| req_view_all | ✓ | ✓ | ✓ | ✗ |
| req_create | ✓ | ✓ | ✗ | ✗ |
| req_edit | ✓ | ✓ | ✗ | ✗ |
| req_assign | ✓ | ✓ | ✓ | ✗ |
| req_delete | ✓ | ✗ | ✗ | ✗ |
| cand_search | ✓ | ✓ | ✓ | ✓ |
| cand_add | ✓ | ✓ | ✓ | ✓ |
| cand_export | ✓ | ✓ | ✓ | ✗ |
| cand_delete | ✓ | ✗ | ✗ | ✗ |
| sub_create | ✓ | ✓ | ✓ | ✓ |
| sub_view_all | ✓ | ✓ | ✓ | ✗ |
| sub_reassign | ✓ | ✓ | ✓ | ✗ |
| sub_move_stage | ✓ | ✓ | ✓ | ✓ |
| int_schedule | ✓ | ✓ | ✓ | ✓ |
| int_join_links | ✓ | ✓ | ✓ | ✓ |
| int_feedback | ✓ | ✓ | ✓ | ✓ |
| int_cancel | ✓ | ✓ | ✓ | ✗ |
| rep_view_exec | ✓ | ✓ | ✗ | ✗ |
| rep_view_recruiter | ✓ | ✓ | ✓ | ✗ |
| rep_export_csv | ✓ | ✗ | ✗ | ✗ |
| user_manage | ✓ | ✓ | ✗ | ✗ |
| role_manage | ✓ | ✗ | ✗ | ✗ |
| activity_logs | ✓ | ✗ | ✗ | ✗ |

UI extra rules that the backend must also honor (do not “fix” them):

- Only Super Admin / Dev Team can **modify** users (`canModifyUsers`).
- Admin is **view-only** for user governance toasts even if `user_manage` is true in the matrix.
- Recruiter submissions are scoped to the logged-in recruiter (currently filtered by name “Marcus Chen”).
- Lead submissions have tabs: my / team members / all.

Per-user capability flags (also preserved): `addCandidates`, `submitToClients`, `scheduleInterviews`, `exportReportsCsv`, `viewTeamAnalytics`, `deleteRecords`, `reassignRequirements`.

### 1.5 Pages / features inventory

| Module | Primary files | Data today |
|---|---|---|
| Requirements | `RequirementsPage`, `CreateJobDemandForm`, `RequirementDetailOverview`, `NewRequirementModal`, `RevokeRequirementModal` | `App.tsx` state from `INITIAL_REQUIREMENTS` |
| Candidates | `AddCandidatePage`, `CandidateRepositoryPage` | `ModulePage` local `INITIAL_CANDIDATES` |
| Submissions | `SubmissionsPage`, `SubmitToLeadPage`, `SubmitCandidateModal` | App state + `submissionsStore` + `forwardRequestsStore` |
| Interviews | `InterviewTrackingPage`, `ScheduleInterviewModal`, `InterviewFeedbackModal` | App state from `INITIAL_INTERVIEWS` |
| Clients | `ClientsPage`, `ClientDeliveryGapAnalysisPage`, `ClientDetailAnalyticsPage` | Hardcoded `INITIAL_CLIENTS` in page |
| Users / Roles | `UserManagementPage`, `RolesPermissionsPage`, `TeamsPage`, `TeamsRecruitersPage`, `MyTeamPage`, `RecruitersPage` | Hardcoded in pages |
| Reports | `ReportsPage`, charts under `components/ui/*`, `PremiumReportsAnalytics` | Mix of props + hardcoded chart datasets |
| Audit / History | `ActivityLogsPage`, `HistoryPage` | App `activityLogs` + page-local history |
| Profile / Auth | `MyProfilePage`, auth/* | `DEMO_ACCOUNTS` |
| Notifications / Search | `NotificationPopover`, `CommandPaletteModal` | Client mock |
| Screen time | `screenTimeTracker.ts`, `ScreenTimeWidget` | localStorage |

### 1.6 Business workflows to preserve (no redesign)

1. **Requirement:** create / draft / assign / revoke / status Active|On Hold|Closed.
2. **Candidate:** add (manual + resume upload) → repository → duplicate check → submit to requirement.
3. **Submission:** recruiter submits → optionally **submit to lead** → lead **approve/reject** → **forward to client** → client review / interview / offered / placed / rejected.
4. **Interview:** schedule / reschedule / feedback (Passed/Rejected/…) / offer tracking.
5. **Reports, performance, audit, history, notifications** — same filters, tables, charts, role scoping.
6. **User management** — Super Admin provisions/edits; Admin view-only for governance.

### 1.7 Dependencies (frontend)

Runtime: `react`, `react-dom`, `lucide-react`, `recharts`, `react-plotly.js`, `plotly.js-dist`  
Dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `mammoth`, `docx`, `jszip`

---

## 2. Target Architecture

Monorepo at workspace root (original Vite app left intact as backup):

```
Recruiter-Appplication-V2/
  Recruiter-Application-V2/     # ORIGINAL — do not delete
  frontend/                     # Next.js 15 + TypeScript
  backend/                      # NestJS REST API
  ai-service/                   # Isolated AI gateway
  docker-compose.yml
  Caddyfile
  .github/workflows/ci.yml
  .env.example
  MIGRATION_PLAN.md
```

```
Browser (Next.js)
   → NestJS API (JWT + RBAC + data-scope)
        → MongoDB (entities + file metadata)
        → Redis + BullMQ workers (async)
        → Object storage (files; metadata in Mongo)
        → AI Gateway (parse / match / score / rank)
        → Integration adapters (PDL, Naukri, Email, SMS — interfaces)
```

---

## 3. Mapping: existing code → new architecture

| Existing | New location | Action |
|---|---|---|
| `src/components/**` | `frontend/src/components/**` | **Reuse as-is** (client components). No UI rewrite. |
| `src/theme`, `src/config/navigation.ts`, `src/types` | `frontend/src/theme`, `config`, `types` | Unchanged |
| `src/App.tsx` | `frontend/src/features/app/AppShell.tsx` | Keep screen/nav logic; load entities from API instead of only mock constants |
| `src/data/authService.ts` | `frontend/src/services/auth.service.ts` | Same validation UX; credentials go to `POST /api/v1/auth/login` |
| `src/data/mockData.ts` | `backend/src/database/seed/` | Seed Mongo so the UI shows the **same** demo data |
| `submissionsStore`, `savedDraftsStore`, `forwardRequestsStore` | Backend collections + `frontend/src/services/*` | Dual: API is source of truth; localStorage kept only as cache/offline fallback for the same keys |
| `src/data/authService.ts` password rules | Backend DTO validation + same rules in UI | Unchanged UX |
| Page-local `INITIAL_*` arrays | Corresponding NestJS GET endpoints | Pages keep rendering; data sourced from API |
| `ROLE_NAV` | Frontend nav **and** backend route allow-list | Same keys |
| Permission matrix | `backend/src/authorization/permissions.ts` | Exact keys from UserManagementPage |
| Documented REST paths | NestJS controllers under `/api/v1` | Follow `documents/MRAP_API_Integration_and_Endpoint_Documentation.md` |
| `Recruiter-Application-Ver-3/` | — | **Leave unchanged / unused** |

### Files that can remain unchanged (copied)

All presentational components: layout, dashboards, pages, modals, ui, wireframe, landing, auth shells, charts, `theme/`, `config/navigation.ts`, `types/index.ts`, `index.css`.

### Files that need refactoring (behavior-preserving)

| File | Why |
|---|---|
| `authService.ts` | Call NestJS; keep error messages and password rules |
| `SignInPage.tsx` / `RoleLoginPage.tsx` | Await async login (already have loading state) |
| `App.tsx` | Fetch workspace payload; persist mutations via API; keep the same handlers/UI |
| localStorage stores | Persist through API; keep function signatures used by pages |
| `AddCandidatePage` resume parse | Enqueue AI job instead of inventing scores; keep form fields |

### Files that will be moved (copied into Next.js)

Entire `src/` except Vite-only `main.tsx` / `vite-env.d.ts`. Entry becomes `frontend/src/app/page.tsx` rendering the existing app shell.

---

## 4. Backend modules required

Aligned to existing behavior (not invented product):

| NestJS module | Maps to |
|---|---|
| `auth` | login, logout, register-request, forgot/verify/reset, JWT refresh |
| `authorization` | roles, permission matrix, guards |
| `users` | user CRUD, profile, screen-time heartbeat |
| `clients` | client registry, agreements metadata |
| `requirements` | demands, drafts, assign, revoke |
| `recruiters` | recruiter directory / team membership |
| `candidates` | repository, bulk upload enqueue, duplicate check |
| `submissions` | pipeline, lead approval, client forward |
| `interviews` | schedule, feedback, non-joining notes |
| `offers` | offer/placement fields already on interview/submission flows |
| `performance` | recruiter TAT / leaderboard aggregations |
| `reports` | visualizations, export enqueue |
| `notifications` | in-app alerts |
| `audit` | activity logs + login audits |
| `files` | upload/download via storage abstraction |
| `integrations` | PDL / Naukri / Email / SMS **interfaces only** |
| `common` | logging, health, metrics, interceptors, filters |
| `queue` | BullMQ producers |
| `ai-gateway-client` | HTTP client to `ai-service` |

---

## 5. MongoDB collections

Only collections justified by existing entities / screens:

| Collection | Source |
|---|---|
| `users` | DEMO_ACCOUNTS + UserManagement accounts + recruiters/leads/admins |
| `roles` | EnterpriseRoleData permission maps |
| `clients` | ClientsPage `ClientRecord` |
| `requirements` | `Requirement` |
| `requirement_drafts` | `savedDraftsStore` type=requirement |
| `candidates` | `Candidate` |
| `candidate_drafts` | `savedDraftsStore` type=candidate |
| `submissions` | `Submission` + submissionsStore extras |
| `forward_requests` | `ForwardRequest` |
| `interviews` | `Interview` |
| `offers` | InterviewTracking offer-letter rows (when present) |
| `notifications` | NotificationPopover items |
| `activity_logs` | `ActivityLogItem` |
| `login_audits` | ActivityLogsPage `RecruiterLoginRecord` |
| `files` | resume/JD/document metadata (not file bytes) |
| `access_requests` | Sign-up / request-access |
| `password_resets` | OTP recovery |
| `screen_time` | screenTimeTracker |
| `jobs` | BullMQ job metadata (optional; BullMQ also uses Redis) |

**Not created:** invented billing, vector DB, or extra “AI run” collections until a real provider is wired.

Indexes: unique email on users; `req` + `candidate` on submissions; `assignedLead` / `owner` on requirements; `recruiter` on submissions/interviews; timestamps on audit/login.

---

## 6. Frontend Next.js layout

```
frontend/src/
  app/                    # App Router: layout, page, globals.css
  components/             # copied UI (unchanged visually)
  features/app/           # AppShell (migrated App.tsx)
  hooks/
  services/               # HTTP clients
  lib/                    # fetch, tokens
  types/
  store/                  # session token helpers
  config/
  theme/
  data/                   # types + fallback seed (UI must work if API is down during local UI-only mode)
  utils/
```

**Navigation:** Inner module switching stays `activeNav` state (existing Sidebar). Next.js only wraps the SPA so we do **not** remap every module to a new URL (would change navigation). Optional URL sync can be added later without changing labels/order.

---

## 7. Risks / dependencies

| Risk | Mitigation |
|---|---|
| Blind rewrite of 90 UI files | Copy components; only change data/auth adapters |
| Role/nav drift | Keep `ROLE_NAV` and permission keys byte-identical |
| Page-local mock data vs App state | Seed Mongo from the same constants; API returns the same shapes |
| AI “fake intelligence” | Gateway returns `not_configured` unless a real key exists; stored mock match scores stay as **data**, not generated |
| File storage in Mongo | Metadata only; bytes on disk/S3 |
| No existing tests | Add API e2e smoke + `tsc` + Next/Nest builds as gates |
| Nested Ver-3 duplicate | Ignored |
| Docker services not running | Frontend can still render; API calls surface existing error toasts; seed script documented |
| Plotly / recharts in Next | Load charts as client components only |

---

## 8. Incremental implementation order

1. Plan (this file) + git checkpoint of original tree  
2. Next.js shell wrapping copied UI  
3. NestJS + Mongo schemas + seed + JWT/RBAC  
4. Wire auth + workspace reads/writes  
5. Redis/BullMQ + file storage + AI gateway interfaces  
6. Docker Compose + Caddy + CI  
7. Build, typecheck, fix breakage — **do not proceed if workflows break**

---

## 9. Out of scope (explicit)

- UI redesign, new screens, new roles, new workflow steps  
- Changing approval/rejection rules or report visuals  
- Deploying to production  
- Implementing live OpenAI/Naukri/Twilio calls without configured secrets  
- Deleting the original Vite app
