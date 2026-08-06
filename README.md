# Seedwel Investment Limited — Billionaire Blueprint & Investor Platform

A full-stack wealth-education and investor platform for **Seedwel Investment Limited**
(registered 2025): a React + Vite + Tailwind frontend, a Node/Express REST API, and a
real database — now with **Firebase Authentication**, a registered-only course, and a
**management-only admin console** that controls the entire database and every private API.

## What's inside

| Area | Details |
| ---- | ------- |
| Public site | Home (niches, principles, steps, gallery), Founders (with the real photos of Mr. Seedwell Khayalethu Masuku & Zacheus Simbaya), Blog, Videos, Search, **Invest** (opportunities + deal-flow form) |
| Registered students | Full 28-lesson course, quizzes, comments, account-bound progress, leaderboard, certificate PDF, personal dashboard (`/account`) |
| Admin (management only) | Overview metrics, **Registered Users** management (grant/revoke admin), **Content Manager** (create/edit/delete lessons, videos, niches, founders, posts, modules — writes straight to the DB), **Inbox & Deal Flow** (messages, subscribers, investor inquiries), **Database Console** (browse every table, delete any record, restore default content), **Upgrade Advisor**, and the admin-only **API Explorer** |

## Authentication model (important)

- Users register / sign in with **Firebase Authentication** (email + password) on `/auth`.
- **The course requires registration**: `/lessons/:id`, `/certificate` and `/account` are
  locked until signed in. Progress/comments are bound to the user's Firebase `uid`.
- The server **verifies Firebase ID tokens** against Google's public certificates
  (`server/firebaseAuth.mjs`) — no service-account key in the repo.
- Admin rights = token email on the **allowlist** (defaults:
  `seedwell@seedwel.com`, `seedwell@seedwelinvestment.com`, `zacheus@seedwelinvestment.com`,
  `admin@seedwel.com`; extend with the `ADMIN_EMAILS` env var, comma-separated) **or**
  a `role: "admin"` record in the `users` table (toggleable in the admin UI).
- **Nothing sensitive is exposed**: the Firebase web config in `src/lib/firebase.ts` is a
  public identifier by design; all PII endpoints (`GET /api/contact`, `/api/newsletter`,
  `/api/investors`, `/api/database`) and everything under `/api/admin/*` return `401/403`
  without a verified admin token. The `/api-docs` explorer is admin-only.
- A **development-only** admin login (`seed@admin` / `122023`,
  override with `DEV_ADMIN_PASSWORD`) exists purely so local previews work before Firebase
  users exist. It is **hard-disabled in production** (`NODE_ENV=production` or on Vercel).

### First-time Firebase setup (5 minutes)

1. Open the Firebase Console → project **`seedwel-cbeb8`** → *Authentication* →
   *Sign-in method* → enable **Email/Password**.
2. In *Authentication → Users* → *Add user*, create the management accounts, e.g.
   `seedwell@seedwel.com` and `zacheus@seedwelinvestment.com` (any strong passwords).
3. Done — those emails are on the admin allowlist, so they can sign in at `/admin`
   immediately. Everyone else who registers becomes a student in the `users` table.

## Quick start (local)

```bash
npm install

# 1. Start the API + database server (port 3001)
npm run server

# 2. In another terminal, start the Vite dev server (port 5173)
npm run dev
```

Open http://localhost:5173 — the frontend proxies `/api/*` to the backend.

The SQLite database is created automatically at `data/billionaire.db` and seeded from
`src/data/content.json` on first run (`RESEED=1 npm run server` to force a re-seed, or use
**Restore Default Content** in the admin console).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — `vercel.json` handles everything (`api/index.mjs` serverless
   function + static `dist/` build + SPA rewrites).
3. **(Recommended) Add persistence** — the API auto-detects:
   - **Vercel Postgres / Neon / Supabase** — via `DATABASE_URL`
   - **Vercel KV** (Upstash Redis) — via `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - Without either: an in-memory store (works, but resets on cold starts).

   Storage selection order: `DATABASE_URL` → KV env vars → in-memory (serverless) / SQLite (local).
   **All four engines support the full admin feature set** (users, content CRUD, table
   browser, reseed) — the DB is always the source of truth at runtime.

4. Production is Firebase-auth only (the dev login is refused there). Optionally set
   `ADMIN_EMAILS` in Vercel env to extend the admin allowlist.

## Pages

| Route | Access | Description |
| ----- | ------ | ----------- |
| `/` | public | Home: niches, principles, steps, gallery, blog preview, PDF guide |
| `/auth` | public | Sign in / create account (Firebase), password reset |
| `/lessons` | public | Curriculum outline + lock states + leaderboard (CTA to register) |
| `/lessons/:id` | **registered** | Lesson detail: content, takeaways, action steps, quiz, comments |
| `/certificate` | **registered** | Official PDF certificate at 100% completion |
| `/account` | **registered** | Student dashboard: progress, ranks, next lesson, sign-out |
| `/videos` | public | 7 video masterclasses (YouTube embeds) |
| `/founders` | public | Leadership, testimonials, contact + investor forms |
| `/invest` | public | Investment opportunities + deal-flow inquiry form |
| `/blog`, `/blog/:slug` | public | Founder articles + newsletter signup |
| `/search` | public | Site-wide search |
| `/admin` | **admin** | The full management console |
| `/api-docs` | **admin** | Live API explorer grouped by access tier + DB inspector |

The **menu icon** (top-right on every page) opens the full menu with everything —
Learn, Company, My Account, downloads and sign-in state.

## API tiers

Everything is documented live in the admin API explorer (`/api-docs`). Summary:

- **Public** — content reads (`/api/lessons`, `/api/videos`, `/api/founders`, `/api/niches`,
  `/api/posts`, `/api/modules`, `/api/search`, `/api/leaderboard`, `/api/comments`,
  `/api/stats`, `/api/health`) and public writes (`POST /api/contact`, `/api/newsletter`,
  `/api/investors`, `POST /api/comments` is student).
- **Student** (`Authorization: Bearer <Firebase ID token>`) — `POST /api/auth/me`,
  `GET/POST/DELETE /api/progress`, `POST /api/comments`.
- **Admin** — `GET /api/admin/overview`, `/api/admin/recommendations`, `/api/admin/users`
  (`PATCH/DELETE /api/admin/users/:uid`), `/api/admin/database` (`GET` tables, `GET :table`
  rows, `DELETE :table/:key`), `/api/admin/content/:resource` (`GET/POST` + `PUT/DELETE :id`
  for lessons, videos, niches, founders, posts, modules), `POST /api/admin/reseed`, plus the
  PII reads `GET /api/contact`, `/api/newsletter`, `/api/investors`, `/api/database`.

## Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS 4, lucide-react, jsPDF, Firebase JS SDK
- **Backend:** Express 5 on Node 22, deploys as a Vercel serverless function;
  Firebase ID-token verification with zero extra dependencies (`node:crypto` + Google certs)
- **Database:** SQLite (`node:sqlite`) locally; Postgres or Vercel KV on Vercel — one
  storage abstraction in `server/storage.mjs` with identical admin capabilities everywhere
- **Content source of truth:** `src/data/content.json` (bundled seed; admin edits override it in the DB)

> For educational purposes only. Not financial advice.
