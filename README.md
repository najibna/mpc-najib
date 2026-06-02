# Intact Receipt Manager

**MPC Hacks × Intact Insurance** — corporate card expense demo with rule checks, approvals, Ask AI, and an intern-ready backend stack.

> Upload Excel → Spring Boot API → MongoDB + RabbitMQ → React dashboard

**Live:** https://mpc-najib.onrender.com · **API:** https://mpc-najib-api.onrender.com

---

## What this demonstrates (backend / generalist intern)

| Skill area | How it shows up in this repo |
|------------|------------------------------|
| **Java** | Java 21, layered services, domain models |
| **Spring Boot** | REST controllers, validation, auto-configuration |
| **Maven** | `pom.xml`, `mvn test`, `mvn package` |
| **Git** | Feature branches, clean history, `.gitattributes` |
| **MongoDB** | Spring Data repositories for transactions, violations, reviews, reports |
| **RabbitMQ** | Async `transactions.uploaded` → policy scan → domain events |
| **Docker** | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| **Kubernetes** | Sample manifests in `/k8s` (deployments + services) |
| **AWS-ready** | Containerized API/UI, stateless API, external data + messaging |
| **React + TypeScript** | Vite SPA, typed API client, demo fallbacks |
| **APIs** | REST: `/api/transactions`, `/api/reviews`, `/api/reports`, `/api/health` |
| **Microservices-style** | API + worker flow via message broker (single repo, demo-friendly) |

---

## Architecture

```
React (TypeScript)  →  Spring Boot API  →  MongoDB
                              ↓
                         RabbitMQ (async policy checks)
```

**Backend packages:** `controller` · `service` · `repository` · `model` · `dto` · `config` · `messaging`

**Events:** `transactions.uploaded` · `policy.violation.detected` · `review.approved` · `review.denied` · `report.generated`

Open **Architecture** in the app nav for a visual overview and tech badges.

---

## Run locally

### Full stack (recommended)

```bash
docker compose up --build
```

- **UI:** http://localhost:3000  
- **API:** http://localhost:8010  
- **RabbitMQ management:** http://localhost:15672 (guest/guest)  
- **MongoDB:** localhost:27017  

Set `OPENROUTER_API_KEY` in the environment or a `.env` file for Ask AI.

### API only

```bash
cd backend
cp .env.example .env   # edit Mongo/Rabbit URLs if needed
mvn spring-boot:run
```

Requires MongoDB and RabbitMQ running (or use `docker compose up mongodb rabbitmq`).

### Frontend only

```bash
cd frontend && npm install && npm run dev
```

`frontend/.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8010
```

---

## API endpoints (new)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + MongoDB/RabbitMQ status |
| GET | `/api/transactions` | List stored transactions |
| POST | `/api/transactions/upload` | Upload Excel (async policy check) |
| GET | `/api/transactions/risky` | High risk-score transactions |
| POST | `/api/reviews/{id}/approve` | Approve a violation review |
| POST | `/api/reviews/{id}/deny` | Deny a violation review |
| GET | `/api/reports/summary` | Latest expense summary report |

Existing demo UI still uses `/api/smb/*` (unchanged).

---

## Tests

```bash
cd backend && mvn test
cd frontend && npm run build
```

---

## Kubernetes (sample)

```bash
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

Build and tag images locally (`intact-backend:latest`, `intact-frontend:latest`) before applying.

---

## Hosted on Render

See `render.yaml` for the production static site + Java API. Add `OPENROUTER_API_KEY` on the API service.

---

Built for **MPC Hacks** · Intact-style UI · ~4,180 sample charges in the demo
