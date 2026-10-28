# API Reference — `/api/v1`

Base URL (dev): `http://localhost:3001/api/v1`  
Proxied from the UI: `http://localhost:3000/api/v1` (Next rewrite) or Caddy `:8080`.

**Swagger UI (dev):** [http://localhost:3001/api/docs](http://localhost:3001/api/docs) — OpenAPI JSON at `/api/docs-json`. Disabled by default in production (`SWAGGER_ENABLED=false`).

All JSON endpoints except auth login/register/forgot/verify/reset and `/health*` require JWT:

```
Authorization: Bearer <accessToken>
Cookie: access_token=<accessToken>
```

Successful login also sets httpOnly cookies `access_token` (8h) and `refresh_token` (7d).

OTP codes are returned in the forgot-password body **only when `NODE_ENV` is not `production`**.

---

## Health (no prefix)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Process health |
| GET | `/health/db` | Mongo connectivity |

---

## Auth

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Body `{ email, password, role? }` → `{ accessToken, refreshToken, user }` + cookies |
| POST | `/auth/logout` | Public | Clears cookies; optional `{ refreshToken }` |
| POST | `/auth/register-request` | Public | Creates an active user (sign-up request) |
| POST | `/auth/forgot-password` | Public | Issues OTP (dev body includes `otpCode`) |
| POST | `/auth/verify-otp` | Public | `{ email, otpCode }` → `{ resetToken }` |
| POST | `/auth/reset-password` | Public | `{ token, newPassword }` |
| POST | `/auth/refresh` | Public | `{ refreshToken }` → new access token |
| GET | `/auth/me` | JWT | Current user + permissions |

### Seeded users (`SEED_ON_START`)

| Role | Email | Password |
| --- | --- | --- |
| superadmin | r.haines@talentflow.io | Admin@2026 |
| admin | d.park@talentflow.io | Admin@2026 |
| lead | harish.g@metaforgeit.com | Lead@2026 |
| recruiter | m.chen@talentflow.io | Rec@2026 |
| devteam | dev.team@talentflow.io | Dev@2026 |
| client | client@accenture.com | Client@2026 |

---

## Workspace bootstrap

| Method | Path | Description |
| --- | --- | --- |
| GET | `/workspace` | Full SPA payload: `requirements`, `submissions`, `interviews`, `recruiters`, `leads`, `admins`, `activityLogs`, `candidates`, `clients`, `teams`, `users`, `stats` mapped to frontend field names (`id` = `reqCode` / `submissionId` / …) |

---

## Domain modules

### Users & roles

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/users` | JWT |
| GET | `/users/me` | JWT |
| PUT | `/users/me` | JWT |
| POST | `/users/screen-time` | JWT |
| GET | `/users/:id` | JWT |
| POST | `/users` | `user_manage` (admin+) |
| PUT | `/users/:id` | `user_manage` |
| DELETE | `/users/:id` | `user_manage` |
| GET | `/roles/permissions` | JWT |
| PUT | `/roles/permissions` | `role_manage` |

### Organizations

| Method | Path | Roles |
| --- | --- | --- |
| POST | `/organizations` | superadmin, admin |
| GET | `/organizations` | superadmin, admin, lead |
| GET | `/organizations/:id` | + recruiter |

### Requirements

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/requirements` | JWT (recruiters: assigned only) |
| GET | `/requirements/:id` | JWT (`id` or `reqCode`) |
| POST | `/requirements` | `req_create` — accepts frontend `{ title, client, skills, openings }` or `{ clientId, clientName }` |
| PUT | `/requirements/bulk` | `req_edit` |
| PUT | `/requirements/:id` | `req_edit` |
| POST | `/requirements/:id/assign` | `req_assign` |
| POST | `/requirements/:id/revoke` | `req_assign` |
| DELETE | `/requirements/:id` | `req_delete` |

### Candidates

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/candidates` | filters: search, skill, experience, location, status, page, limit |
| POST | `/candidates/duplicate-check` | JWT |
| POST | `/candidates/bulk-upload` | JWT |
| GET | `/candidates/:id` | JWT |
| POST | `/candidates` | `cand_add` |
| PUT | `/candidates/:id` | JWT |
| DELETE | `/candidates/:id` | `cand_delete` |

### Submissions

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/submissions` | filters: stage, recruiterId, leadId, clientId, requirementId, candidateId |
| GET | `/submissions/:id` | includes history |
| POST | `/submissions` | `sub_create` — ObjectIds **or** frontend `{ candidate, email, req, client, recruiter, match, stage }` |
| PUT | `/submissions/:id/stage` | `sub_move_stage` |
| POST | `/submissions/:id/lead-approval` | lead+ |
| POST | `/submissions/:id/forward-client` | JWT |
| DELETE | `/submissions/:id` | lead+ |

### Interviews

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/interviews` | JWT |
| GET | `/interviews/:id` | JWT |
| POST | `/interviews` | `int_schedule` |
| PUT | `/interviews/:id/reschedule` | JWT |
| PUT/POST | `/interviews/:id/feedback` | `int_feedback` |
| POST | `/interviews/:id/cancel` | `int_cancel` |
| DELETE | `/interviews/:id` | JWT |

### Clients, teams, offers, notifications

| Method | Path |
| --- | --- |
| CRUD | `/clients` |
| CRUD | `/teams` |
| CRUD + `/status` | `/offers` |
| GET / mark-read / delete | `/notifications` |

### Analytics

`GET /analytics/dashboard | requirements | candidates | submissions | interviews | offers | clients | recruiters`

Query: `startDate`, `endDate`, plus entity-specific filters.

### Audit

| Method | Path |
| --- | --- |
| GET | `/audit-logs` or `/audit` |
| GET | `/audit-logs/:id` |
| POST | `/audit/logs` | SPA activity log from the UI |

Collection name: **`activity_logs`**.

### Files, AI, blacklist, saved searches, email templates

| Method | Path |
| --- | --- |
| files | `/files` |
| POST | `/ai/match` `/ai/search` `/ai/parse-resume` `/ai/enrich` |
| GET | `/ai/match-scores` |
| CRUD | `/candidate-blacklist` `/saved-searches` `/email-templates` |

---

## Error shape

```json
{ "statusCode": 401, "message": "Invalid email or password", "error": "Unauthorized" }
```

Validation errors return `400` with `message` as string or string[].

---

## CORS

`CORS_ORIGINS` (comma-separated). Credentials enabled so the SPA can send cookies through the Next proxy.
