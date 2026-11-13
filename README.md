# LeaderSync

Team and assignment tracker in Khmer and English. Leaders create groups, assign tasks with deadlines and approve work. Members post daily to-do lists and track progress.

**Stack:** React 19, Vite, Tailwind 4 · Node.js, Express 5, TypeScript · PostgreSQL

**Features:** Khmer and English, light and dark mode (☾/☀ button in the header; remembers your choice and follows the system setting at first), avatars, Super Admin page with soft delete and restore, mobile tab bar.

## Run locally

Needs Node.js 20.19+ and a PostgreSQL database (pgAdmin works fine).

```bash
npm install
cp .env.example .env      # then set DATABASE_URL
npm run db:create         # creates the database if missing
npm run admin:reset -- <username> <password>   # creates the Super Admin
npm run dev               # http://localhost:5173
```

Tables are created automatically when the server starts. Without `DATABASE_URL`, a small embedded database is used for quick tests only.

## Settings (.env)

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Required in production. |
| `DATABASE_SSL` | `false` for a local PostgreSQL. On by default in production. |
| `JWT_SECRET` | Required in production, 32+ random characters. |
| `ALLOW_REGISTRATION` | `false` = invite-only. |
| `NODE_ENV` | `production` when deployed. |

Never commit `.env`.

## How people join

- The first account to register becomes the only Super Admin.
- **Invite:** the Super Admin adds an email in a group. That person registers with the same email.
- **Group code:** anyone signed in can use **Join a Group** with the code shown on the group page.
- Set `ALLOW_REGISTRATION=false` so only invited emails can register.

## Deploy

Use one Node.js web service plus one PostgreSQL database (for example Render + Neon). `render.yaml` sets up the web service; paste the Neon connection string as `DATABASE_URL`.

```
Build:   npm ci --include=dev && npm run build
Start:   npm start
Health:  /api/health (no database call; /api/health/db also checks the database)
Env:     NODE_ENV=production, DATABASE_URL, JWT_SECRET
```

Free hosting sleeps when idle. To keep it awake, add one UptimeRobot HTTP monitor on `/api/health` (every 5 minutes).

Then run `npm run admin:reset:prod -- <username> <password>` once against the production database. A `Dockerfile` and `docker-compose.yml` are included for Docker.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | API and web with reload |
| `npm run build` / `npm start` | Build and run for production |
| `npm run lint` | Type check |
| `npm test` | Unit tests |
| `npm run db:create` | Create the database |
| `npm run admin:reset` | Set the Super Admin login |

## Roles

| | Super Admin | Team Lead | Member | Viewer |
| --- | :-: | :-: | :-: | :-: |
| Create and delete groups, manage members | ✅ | | | |
| Assign and approve tasks and standups | ✅ | ✅ | | |
| Post standups, update own tasks | ✅ | ✅ | ✅ | |
| View the group | ✅ | ✅ | ✅ | ✅ |

A Team Lead's powers apply only in groups they belong to. Permissions are enforced by the API.

## Folders

```
client/   React app
server/   API, database, migrations
shared/   code used by both
tests/    unit tests
```

Colours are tokens at the top of `client/src/index.css`; dark mode overrides them under `html.dark`.

To change the database, add a new entry to `server/db/migrations.ts`. Never edit an old one.
