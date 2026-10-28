# Documents

This folder is the **full-stack application documentation** for Recruiter Application V2 (MetaForge Recruitment). Product BRD/SRS/FRD files remain in `documents Of the Application/`. Database design lives in `docs/database/`.

| Document | Purpose |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Edge → frontend → NestJS → MongoDB/Redis/AI workflow matching the system diagram |
| [API_REFERENCE.md](./API_REFERENCE.md) | REST API for `/api/v1/*` used by the Next.js UI and Caddy |
| [FULLSTACK_INTEGRATION.md](./FULLSTACK_INTEGRATION.md) | How the SPA hydrates from Mongo, session, and seed credentials |

Runtime source of truth:

- **23 MongoDB collections** in `metaforge_recruiter_v2` (including `activity_logs`, not `audit_logs`)
- NestJS global prefix `api/v1` (health routes excluded)
- Frontend `NEXT_PUBLIC_API_URL=/api/v1` via Next.js rewrite / Caddy
