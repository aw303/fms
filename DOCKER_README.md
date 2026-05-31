# Docker Setup

This Docker setup supports the planned stack:

- Laravel 12 / PHP 8.3 backend
- Angular 19 frontend
- MySQL by default, with optional PostgreSQL
- Redis for cache, queues, and sessions
- Nginx for the Laravel API

## Expected project structure

```text
.
├── backend/      # Laravel application
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
- Laravel API via Nginx: http://localhost:8080
- MySQL: localhost:3306
- Redis: localhost:6379

## Laravel setup

After creating or placing the Laravel app in `backend/`, install dependencies and generate the app key:

```bash
docker compose run --rm backend composer install
docker compose run --rm backend php artisan key:generate
docker compose run --rm backend php artisan migrate
```

Use these database values in `backend/.env`:

```env
DB_CONNECTION=mysql
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

Then update Laravel:

```env
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=logistics
DB_USERNAME=logistics
DB_PASSWORD=secret
```
