# Docker Setup

This Docker setup supports the planned stack:

- FastAPI / Python 3.12 backend
- Angular 19 frontend
- MySQL by default, with optional PostgreSQL
- Redis for cache and background workers
- Nginx as API gateway/reverse proxy

## Expected project structure

```text
.
├── backend/      # FastAPI application
├── frontend/     # Angular application
└── docker-compose.yml
```

## First run

Copy the example environment file:

```bash
cp .env.docker.example .env
```

Start the stack:

```bash
docker compose up --build
```

Default URLs:

- Angular frontend: http://localhost:4200
- FastAPI via Nginx: http://localhost:8080
- FastAPI health endpoint: http://localhost:8080/api/health
- FastAPI docs: http://localhost:8080/docs
- MySQL: localhost:3306
- Redis: localhost:6379

## FastAPI setup

After creating or placing the FastAPI app in `backend/`, install dependencies:

```bash
docker compose run --rm backend pip install -r requirements.txt
```

Use these database values in your backend config:

```env
DB_DRIVER=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=logistics
DB_USERNAME=logistics
DB_PASSWORD=secret

REDIS_HOST=redis
REDIS_PORT=6379
```

## Angular setup

After creating or placing the Angular app in `frontend/`, install dependencies:

```bash
docker compose run --rm frontend npm install
docker compose up frontend
```

## Optional PostgreSQL

PostgreSQL is included behind a Compose profile:

```bash
docker compose --profile postgres up -d postgres
```

Then switch backend DB configuration:

```env
DB_DRIVER=postgresql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=logistics
DB_USERNAME=logistics
DB_PASSWORD=secret
```
