# Sameakki

A team and task tracker in Khmer and English. Leaders create groups, assign tasks with due dates and review the work. Members post a daily ToDo and update their progress.

**Stack:** React 19, Vite, Tailwind 4 · Node.js, Express 5, TypeScript · PostgreSQL

**Version:** 0.9.0 (public beta). See [CHANGELOG.md](CHANGELOG.md).

**Features:** Khmer and English (flag menu in the header), light and dark mode (☾/☀ button in the header; it remembers your choice and follows the system setting at first), avatars, streaks and pokes, optional Telegram messages, task import from a spreadsheet, a Super Admin page with soft delete and restore, and a mobile tab bar.

**Contents:** [Run locally](#run-locally) · [Versions](#versions) · [Settings](#settings-env) · [Accounts and roles](#accounts-and-roles) · [How it works](#how-it-works) · [Telegram](#telegram-optional) · [Search (SEO)](#search-seo) · [Deploy](#deploy) · [Commands](#commands) · [Folders](#folders)

## Run locally

Needs Node.js 20.19+ and a PostgreSQL database (pgAdmin works fine).

```bash
npm install
cp .env.example .env      # then set DATABASE_URL
npm run db:create         # creates the database if it is missing
npm run admin:reset -- <username> <password>   # creates the Super Admin
npm run dev               # http://localhost:5173
```

The tables are created automatically when the server starts. Without `DATABASE_URL`, a small embedded database is used, for quick tests only.

## Versions

The version follows [Semantic Versioning](https://semver.org), `MAJOR.MINOR.PATCH`, and it is written in `package.json` only. The app shows it in the footer, and `/api/health` reports it. Write what changed in [CHANGELOG.md](CHANGELOG.md) first, then change the number.

| Change | Example | Command |
| --- | --- | --- |
| A fix, with no new feature | 0.9.0 → 0.9.1 | `npm version patch --no-git-tag-version` |
| A new feature that breaks nothing | 0.9.0 → 0.10.0 | `npm version minor --no-git-tag-version` |
| The first stable release, or a big change | 0.x → 1.0.0 | `npm version major --no-git-tag-version` |

While the number starts with 0, the app is still a beta. Move to 1.0.0 when real teams use it every week without surprises.

## Settings (.env)

| Name | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Required in production. |
| `DATABASE_SSL` | `false` for a local PostgreSQL. On by default in production. |
| `JWT_SECRET` | Required in production. Use 32 or more random characters. |
| `NODE_ENV` | `production` when deployed. |
| `TELEGRAM_BOT_TOKEN` | Optional. The bot token from BotFather. It turns on Telegram messages. |
| `TELEGRAM_BOT_USERNAME` | Optional. The bot's username, used for the connect link. |
| `TELEGRAM_WEBHOOK_SECRET` | Optional. Must match the `secret_token` given to `setWebhook`. |
| `APP_URL` | Optional. The site address that is added to Telegram messages. |

Never commit `.env`.

## Accounts and roles

There is no public sign-up. Every account is made by someone who already has one.

- **Super Admin:** create it once with `npm run admin:reset -- <username> <password>`. On a deployed server, use `npm run admin:reset:prod -- <username> <password>`.
- **Team Leaders:** the Super Admin creates them in the Admin tab, with an optional end date and member limit. Leave the password empty to have one generated and shown once.
- **Members:** a Team Leader adds them to a group, either as a new account or as an account the leader already created. They must change a generated or reset password the first time they log in.
- **Username:** anyone can choose a short username in **My settings** and log in with it instead of the email. It has 3-40 lowercase letters, numbers, `.`, `_` or `-`, it must be unique, and the letter case does not matter. Only the owner can see it.
- **Group code:** anyone who already has an account can use **Join a Group** with the code shown on the group page.
- **Privacy:** the Super Admin cannot open a group's tasks, ToDos or comments, unless that group's leader allows it for a limited time.

| | Super Admin | Team Lead | Member | Viewer |
| --- | :-: | :-: | :-: | :-: |
| Create a group | ✅ | ✅ | | |
| Add and remove members | ✅ | ✅ (own groups) | | |
| Delete a group | ✅ | | | |
| Assign, review, approve and reopen tasks and daily ToDos | ✅ | ✅ | | |
| Post daily ToDos, update own tasks, comment | ✅ | ✅ | ✅ | |
| View the group | ✅ | ✅ | ✅ | ✅ |

A Team Lead's powers apply only in the groups they lead. The API enforces all permissions.

## How it works

### Daily ToDo

Members write the ToDo in one text box. A line without `-` is a **main point**, and a line that starts with `-` is a **task to tick**. Main points are optional.

```
Final project          <- the first main point is the title
Website                <- more main points group the tasks below them
- Design the login page - 80%
- [x] Set up the database
Mobile app
- Build the home screen
```

`- 80%` or `(80%)` at the end of a line sets the progress. `[x]` or `100%` marks the task as done. A list of only `-` lines also works. The rules are in `shared/dailyLogParser.ts`, and the preview under the box uses the same code.

### Tasks

A leader gives a task to one person, to some people, or to everyone. The person moves the progress bar.

**Flow:** To do (0%) → In progress (above 0%) → Waiting for review (100%, or "Done, send for review") → Approved.

- The leader reviews each task. **Approve** locks it. **Request changes** needs a reason, sends it back to In progress and notifies the person.
- **Approve all** approves everything that is waiting for review in the current view.
- Approved work is locked for everyone, the leader too. A leader taps **Reopen to edit** to change it, and it goes back to review.
- A leader can edit the title, description, category and priority with the pencil, unless the task is approved. A team task changes for everyone.
- Descriptions keep their line breaks, and long ones have a "Show more" button.
- The Tasks page has a "How tasks work" panel (the light bulb) with these rules.

### Filters

The Overview, Daily ToDo and Tasks pages look and work the same way (`FilterControls.tsx`), and they use the same words for the same states.

- **Whose:** All, Just me (my own tasks), or With my team (the team tasks that include me).
- **When:** Any time, Today (running today and not approved), Overdue, or a From-To range of dates.
- **Status** and search. On the Tasks page, **More filters** holds the member, the category and the sort order.
- The numbers on the buttons count cards, and a team task is one card. The rules are in `client/src/lib/taskFilters.ts`.
- The Overview has a **Today** row and cards that open Tasks or Daily ToDo already filtered (`client/src/lib/pagePreset.ts`).

### Import tasks

On the Tasks page, a leader taps **Import tasks** and pastes a table from Google Sheets or Excel (or picks a CSV file).

- **Needed columns:** `Task title`, `Due date`.
- **Optional columns:** `Module`, `Assign to` (`Everyone` or `Choose`), `Members` (names or emails, separated by commas), `Priority`, `Start date`, `Due time`, `Details`.
- A preview shows the problems of each row, and rows with problems are skipped. Up to 200 rows are created in one go, all or nothing.
- The rules are in `shared/taskImport.ts`, and the API is `POST /api/groups/:id/tasks/import`.

### Streaks and pokes

- **Streak:** the days in a row with at least one daily ToDo (Cambodia time). It stays alive today until the day ends, and it breaks after one whole missed day. The rules are in `shared/streak.ts`. The ranking is on the Overview, and your own streak is on the post box.
- **Poke:** a member who has not posted today can be poked by other members, once per person per day. The person gets a notification in the bell, and a Telegram message if they connected Telegram (`server/routes/streaks.ts`).

## Telegram (optional)

Without these settings, everything works and notifications show only in the bell.

When a person connects Telegram, the same notifications are also sent there (new task, ready for review, approved, changes requested, comments, plan ending), in the language they use in the app. A checkbox in **My settings** limits it to pokes only. Reactions, date reminders and password resets stay in the app (`server/services/notifications.ts`, `shared/notificationText.ts`).

A bot can only write to a person after that person presses Start once. This is a Telegram rule, so the app shows a one-tap **Connect Telegram** card on the streak ranking.

**Set up the bot**

1. In Telegram, talk to `@BotFather`, send `/newbot`, and keep the token and the bot's username.
2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` and `TELEGRAM_WEBHOOK_SECRET` (a long random string). `APP_URL` is optional.
3. Tell Telegram where to send updates. Do this once, and again if the address changes:

   ```
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" -d url=https://<your-domain>/api/telegram/webhook -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
   ```

4. Each person opens **My settings → Connect Telegram** and presses Start. The chat id is stored privately. They can disconnect at any time, or send `/stop` to the bot.

## Search (SEO)

The app is a single-page app, so search engines get plain HTML from the server.

- `/guide` (Khmer) and `/en/guide` (English) are built from `client/src/locales/guide.ts` by `server/seo/guidePage.ts`. They have a title, a description, a canonical link, `hreflang` links and structured data (TechArticle, HowTo, FAQPage and BreadcrumbList).
- `/sitemap.xml` lists the home page and both guides, and `/robots.txt` points to it.
- The home page has its meta tags and JSON-LD in `client/index.html`, and the landing page switches them to the visitor's language.
- After a deploy, add the site to Google Search Console and request indexing for `/`, `/guide` and `/en/guide`.

## Deploy

Use one Node.js web service and one PostgreSQL database (for example Render and Neon). `render.yaml` sets up the web service. Paste the Neon connection string as `DATABASE_URL`.

```
Build:   npm ci --include=dev && npm run build
Start:   npm start
Health:  /api/health (no database call; /api/health/db also checks the database)
Env:     NODE_ENV=production, DATABASE_URL, JWT_SECRET
```

Free hosting sleeps when it is idle. To keep it awake, add one UptimeRobot HTTP monitor on `/api/health` (every 5 minutes).

Then run `npm run admin:reset:prod -- <username> <password>` once against the production database. A `Dockerfile` and a `docker-compose.yml` are included for Docker.

**Run everything in Docker** (app, PostgreSQL and pgAdmin):

```bash
docker compose up -d --build        # app at http://localhost:3001
docker exec -it sameakki-app-1 node dist/server/db/resetAdmin.js <username> <password>   # creates the Super Admin
```

The database is at `localhost:5433` (the user, password and database are all `sameakki`), and pgAdmin is at `http://localhost:5050`. Both accept connections only from your own computer. The ports 3001 and 5433 are used so they do not clash with `npm run dev` (3000) or with a PostgreSQL installed on Windows (5432). To start again with an empty database, run `docker compose down -v`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the web app with reload |
| `npm run build` / `npm start` | Builds and runs for production |
| `npm run lint` | Checks the types |
| `npm test` | Runs the tests |
| `npm run db:create` | Creates the database |
| `npm run admin:reset` | Sets the Super Admin login |
| `npm run docs:guide` | Rebuilds `docs/user-guide.*.md` from `client/src/locales/guide.ts` |

## Folders

```
client/   React app
server/   API, database, migrations
shared/   code used by both
tests/    tests
docs/     the user guide in Markdown
```

Colours are tokens at the top of `client/src/index.css`. Dark mode overrides them under `html.dark`.

To change the database, add a new entry to `server/db/migrations.ts`. Never edit an old one.
