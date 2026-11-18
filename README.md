# Sameakki

Team and assignment tracker in Khmer and English. Leaders create groups, assign tasks with deadlines and approve work. Members post daily to-do lists and track progress.

**Stack:** React 19, Vite, Tailwind 4 · Node.js, Express 5, TypeScript · PostgreSQL

**Features:** Khmer and English (flag menu in the header), light and dark mode (☾/☀ button in the header; remembers your choice and follows the system setting at first), avatars, Super Admin page with soft delete and restore, mobile tab bar.

## How it works

**Daily ToDo.** Members write one text box. A line without `-` is a main point, and a line starting with `-` is a task to tick. Main points are optional.

```
Final project          <- first main point = the title
Website                <- more main points group the tasks below them
- Design the login page - 80%
- [x] Set up the database
Mobile app
- Build the home screen
```

`- 80%` or `(80%)` at the end of a line sets progress, and `[x]` or `100%` marks it done. A list of only `-` lines also works. The rules live in `shared/dailyLogParser.ts`, and the preview under the box uses the same code.

**Tasks.** A leader assigns a task to one person, some people or everyone. The assignee moves the progress bar (0% to do, 100% sends it for review). Descriptions keep their line breaks, and long ones have a "Show more" button.

**Approval.** A leader approves a ToDo or task that is waiting for review. Approved work is locked for everyone, the leader too. A leader taps **Reopen to edit** to change it, and it goes back to review.

## Search (SEO)

The app is a single-page app, so search engines get plain HTML from the server:

- `/guide` (Khmer) and `/en/guide` (English) are built from `client/src/locales/guide.ts` by `server/seo/guidePage.ts`. They have a title, description, canonical and `hreflang` links, and structured data (TechArticle, HowTo, FAQPage, BreadcrumbList).
- `/sitemap.xml` lists the home page and both guides, and `/robots.txt` points to it.
- The home page has its meta tags and JSON-LD in `client/index.html`; the landing page switches them to the visitor's language.
- After a deploy, add the site to Google Search Console and request indexing for `/`, `/guide` and `/en/guide`.

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
| `NODE_ENV` | `production` when deployed. |

Never commit `.env`.

## How people join

There is no public sign-up. Every account is created by someone who already has one.

- **Super Admin:** create it once with `npm run admin:reset -- <username> <password>` (on a deployed server: `npm run admin:reset:prod -- <username> <password>`).
- **Team Leaders:** the Super Admin creates them in the Admin tab, with an optional expiry date and member limit. Leave the password empty to have one generated and shown once.
- **Members:** a Team Leader adds them to a group (a new account, or one the leader already created). They must change a generated or reset password the first time they sign in.
- **Group code:** anyone who already has an account can use **Join a Group** with the code shown on the group page.
- **Privacy:** the Super Admin cannot open a group's tasks, updates or comments unless that group's leader allows it for a limited time.

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

**Run everything in Docker** (app + PostgreSQL + pgAdmin):

```bash
docker compose up -d --build        # app at http://localhost:3001
docker exec -it sameakki-app-1 node dist/server/db/resetAdmin.js <username> <password>   # create the Super Admin
```

The database is `localhost:5433` (user, password and database are all `sameakki`) and pgAdmin is `http://localhost:5050`; both only accept connections from your own computer. The ports 3001 and 5433 are used so they do not clash with `npm run dev` (3000) or a PostgreSQL installed on Windows (5432). To start again with an empty database: `docker compose down -v`.

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | API and web with reload |
| `npm run build` / `npm start` | Build and run for production |
| `npm run lint` | Type check |
| `npm test` | Unit tests |
| `npm run db:create` | Create the database |
| `npm run admin:reset` | Set the Super Admin login |
| `npm run docs:guide` | Rebuild `docs/user-guide.*.md` from `client/src/locales/guide.ts` |

## Roles

| | Super Admin | Team Lead | Member | Viewer |
| --- | :-: | :-: | :-: | :-: |
| Create and delete groups, manage members | ✅ | | | |
| Assign, approve and reopen tasks and daily ToDos | ✅ | ✅ | | |
| Post daily ToDos, update own tasks | ✅ | ✅ | ✅ | |
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
