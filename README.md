# MetaForge Recruiter Application Platform (MRAP) V2

Architecture-aligned layout. **UI, roles, permissions, and workflows are unchanged.**

## Layout

```
frontend/           Next.js 15 UI (SPA shell, mock-first with API hydration)
backend/            NestJS API on /api/v1 (JWT, Mongo, optional Redis)
ai-service/         Isolated AI gateway (heuristic parser; LLM keys optional)
workers/            Redis list worker (idles if REDIS_URL is unset)
infrastructure/     Notes for Docker/Caddy
documents/          Pointers to product + database docs
docs/database/      Mongo architecture pack
docker-compose.yml
Caddyfile
.env.example
README.md
```

## Local development

```bash
# Frontend (http://localhost:3000)
cd frontend
copy .env.example .env
npm install
npm run dev

# Backend (http://localhost:3001/api/v1) — needs Mongo
cd backend
copy ..\.env.example .env
npm install
npm run build
npm run start:dev
# Swagger UI: http://localhost:3001/api/docs
# Health:     http://localhost:3001/health

# Optional AI gateway (http://localhost:3002)
cd ai-service
npm start
```

Set `SEED_ON_START=true` so demo users, MetaForge org, Accenture client, and sample requirements are created on boot.

Demo logins:

| Role | Email | Password |
|---|---|---|
| Super Admin | r.haines@talentflow.io | Admin@2026 |
| Admin | d.park@talentflow.io | Admin@2026 |
| Team Lead | harish.g@metaforgeit.com | Lead@2026 |
| Recruiter | m.chen@talentflow.io | Rec@2026 |
| Dev Team | dev.team@talentflow.io | Dev@2026 |
| Client | client@accenture.com | Client@2026 |
