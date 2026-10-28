# Infrastructure

Docker Compose, Caddy, and environment templates live at the **repository root** so local and container runs share one config:

| File | Role |
|---|---|
| `../docker-compose.yml` | mongo, redis, ai-service, backend, frontend, caddy |
| `../Caddyfile` | `/api/*` and `/health` → backend; everything else → frontend |
| `../.env.example` | Copy to `.env` before `docker compose up` |
| `../backend/Dockerfile` | NestJS API image (port 3001) |
| `../frontend/Dockerfile` | Next.js UI image (port 3000) |
| `../ai-service/Dockerfile` | Isolated AI gateway (port 3002) |

CI is not checked in yet. Add GitHub Actions under `.github/workflows/` when you want automated typecheck + build.
