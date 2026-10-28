# Recruiter Application V2 — Architecture Workflow

This application is a full-stack recruitment platform: **Next.js (presentation) + NestJS (application) + MongoDB (data)**, with Redis workers, an AI gateway, Caddy at the edge, and JWT + RBAC on every mutating API.

```
USERS (Super Admin | Admin | Lead | Recruiter | Dev Team | Client)
        │
        ▼
EDGE & ACCESS          CDN/Edge → WAF → Caddy reverse proxy / TLS → Rate limiting
        │
        ▼
PRESENTATION           Next.js + TypeScript SPA (App Router wrapping the existing UI)
                       UI / forms / tables / auth screens
                       In-memory session + httpOnly cookie (no localStorage business data)
        │  /api/v1/*
        ▼
APPLICATION            NestJS REST API  (global prefix api/v1)
  Auth, Users, Roles, Organizations, Workspace bootstrap
  Requirements, Candidates, Submissions, Interviews, Offers
  Clients, Teams, Notifications, Analytics, Audit (activity_logs)
  Files, AI, Blacklist, Saved searches, Email templates
  Guards: JwtAuthGuard + RolesGuard + PermissionsGuard
        │
        ├── ASYNC / JOBS     Redis queue → workers (parse, notify, reports)
        ├── AI GATEWAY       ai-service (JD/resume parse, match, rank, search)
        └── DOCUMENT STORE   file metadata + object storage root
        │
        ▼
DATA LAYER             MongoDB  metaforge_recruiter_v2  (23 collections)
        │
        ▼
INTEGRATION            Email / SMS / sourcing providers (env-optional)
        │
        ▼
OBSERVABILITY          Health checks, logs, metrics hooks
        │
        ▼
DEVOPS                 Git → CI/CD → registry → containerized deploy → Caddy
```

## Request flow

1. Browser hits Caddy (`:8080`) or Next (`:3000`).
2. Static UI is served by Next. API calls go to `/api/v1/*`.
3. Next rewrites `/api/*` to Nest (`:3001`). Caddy can proxy the same path.
4. Nest authenticates JWT from `Authorization: Bearer` **or** `access_token` cookie.
5. Roles and stored permission keys (`roles_permissions`) are enforced on writes.
6. Services read/write Mongo with org-scoped filters. Recruiters only see assigned requirements/submissions.
7. `GET /api/v1/workspace` returns the SPA bootstrap payload mapped to frontend types.
8. Mutations (create requirement, submit candidate, interview feedback, activity log) persist immediately.

## Layers vs this repo

| Diagram layer | Implementation |
| --- | --- |
| Edge & Access | `Caddyfile`, Next rewrites, CORS + credentials |
| Presentation | `frontend/` Next.js + existing App.tsx workflows |
| Application | `backend/src/modules/*` NestJS |
| Security | JWT cookie + bearer, ValidationPipe, Roles + RequirePermission |
| Async jobs | `workers/` + Redis `REDIS_URL` |
| AI & Intelligence | `ai-service/` + `backend/src/modules/ai` |
| Document storage | `backend/src/modules/files` + `STORAGE_ROOT` |
| Data | MongoDB schemas in `backend/src/modules/**/schemas` |
| Integration | env-gated providers |
| Observability | `/health`, `/health/db` |
| DevOps | `docker-compose.yml`, Dockerfiles for backend, frontend, ai-service, workers |

## Session model

- Login `POST /api/v1/auth/login` returns `accessToken` and sets httpOnly `access_token`.
- Frontend keeps the token in **memory** and sends it on every `fetch` with `credentials: 'include'`.
- Refresh of the tab restores the user via `GET /api/v1/auth/me` using the cookie.
- Logout clears cookie + memory. Business entities are not stored in localStorage.

## Seed

With `SEED_ON_START=true` (default outside production), Nest inserts MetaForge org, role permissions, users, clients, requirements, candidates, submissions, interviews, teams, and an activity log so the UI has live Mongo data on first boot.
