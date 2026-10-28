# Full-stack integration

The SPA no longer hydrates from mock arrays or localStorage. After sign-in it loads Mongo-backed data through Nest.

## Boot sequence

1. User submits email/password on Sign In or a role portal.
2. `POST /api/v1/auth/login` validates against `users` (bcrypt). JWT includes `role` and `permissions` from `roles_permissions`.
3. Token is stored in memory; Nest also sets `access_token` cookie.
4. App calls `GET /api/v1/workspace` and replaces:
   - requirements, submissions, interviews
   - recruiters, leads, admins
   - activity logs, candidates, clients, teams, users
5. Page modules (Clients, User Management) also `GET /clients` and `GET /users` so their local tables match Mongo.
6. Writes (`POST /requirements`, `POST /submissions`, interview feedback, `POST /audit/logs`) persist to Mongo. Duplicate checks use the in-memory submissions cache filled from workspace.
7. Tab refresh: `GET /auth/me` via cookie restores the session, then workspace reloads.

## What was removed from the frontend

- localStorage keys for session, nav, JWT, candidate view, remembered email, submissions, drafts, forward requests, screen time
- `DEMO_ACCOUNTS` as an offline login store (seed credential **hints** remain on the login screen; they match `SEED_ON_START` users)
- Mock fallback when the API is down — the UI shows empty collections instead of silently swapping in fixtures

## Mapping notes

| Frontend field | Mongo / API |
| --- | --- |
| `Requirement.id` | `reqCode` |
| `Requirement.client` | `clientName` |
| `Requirement.skills` | `skillsRequired` |
| `Requirement.status` Active | `Assigned` / `In Progress` |
| `Submission.id` | `submissionId` |
| `Submission.req` | requirement `reqCode` |
| `ActivityLogItem.details` | stringified `activity_logs.details` |
| Audit UI permission key | `activity_logs` |

## Run locally

```bash
# Mongo + Redis (or docker compose)
docker compose up -d mongo redis

# Backend (seeds when SEED_ON_START is true / non-production)
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

Open `http://localhost:3000`, sign in with a seeded account, and the dashboards/requirements/candidates lists come from `metaforge_recruiter_v2`.

Full compose (Caddy `:8080`, Nest `:3001`, Next `:3000`, AI `:3002`):

```bash
docker compose up --build
```
