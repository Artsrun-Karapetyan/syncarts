# Syncarts Backend

## Local run

1. Copy `.env.example` to `.env`.
2. Start Postgres:

```bash
docker compose up -d
```

3. Install dependencies.
4. Generate Prisma client and run migration.
5. Start the API.

## Scripts

- `npm run dev`
- `npm run typecheck`
- `npm run db:generate`
- `npm run db:migrate`

## Auth endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

## Register body

```json
{
  "email": "user@example.com",
  "name": "Artsrunk",
  "password": "secret123"
}
```

## Login body

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```
