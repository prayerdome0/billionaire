# Seedwel Investment Limited — Billionaire Blueprint & Investor Platform

A full-stack wealth-education and investor platform for **Seedwel Investment Limited**
(registered 2025): a React + Vite + Tailwind frontend, a Node/Express REST API, and
**Firebase as the true database** — Cloud Firestore holds the course catalog, the
user **admin roles**, and the **Seedwel Certificate Incorporation** registry.

**Program model:** tuition is **100% free** (this is a certification program — no school
has been built). The only fee in the entire program is a **one-time $5 certificate
issuance fee**, recorded permanently in the Firebase certificate registry with a unique
serial number.

## What's inside

| Area | Details |
| ---- | ------- |
| Public site | Home (niches, principles, steps, gallery), Founders (with the real photos of Mr. Seedwell Khayalethu Masuku & Zacheus Simbaya), Blog, Videos, Search, **Invest** (opportunities + deal-flow form) |
| Registered students | Full 28-lesson course (free tuition), quizzes, comments, account-bound progress, leaderboard, personal dashboard (`/account`) that **detects the admin tab** and lists **who is assigned admin** — straight from the Firebase `admins` registry |
| Certificates ($5) | `GET /certificate` — 100% completion → pay **$5** (instant card checkout or manual payment approved by an admin) → download the official PDF with its `SCI-YYYY-000123` registry serial. Stored in Firestore `certificates/{uid}` |
| Admin (management only) | Overview metrics incl. **certificate revenue**, **Registered Users** (grant/revoke admin — role written into **Firebase**, `users/{uid}.role` + `admins/{uid}` mirror), **Certificates** tab (approve $5 payments, revenue), **Content Manager**, **Inbox & Deal Flow**, **Database Console** (browse tables + **publish the curriculum to Firestore**), **Upgrade Advisor**, admin-only **API Explorer** |

## Firebase data model (the true database)

| Collection | Access | Contents |
| ---------- | ------ | -------- |
| `modules`, `lessons`, `videos`, `niches`, `founders`, `posts` | public read, admin write | the live course database — the site reads Firestore first, REST API as fallback |
| `users/{uid}` | owner or admin | profile + **`role: "admin" \| "student"`** — founders auto-promote via the allowlist |
| `admins/{uid}` | public read, admin write | mirror of assigned admins (powers the student dashboard "Assigned Administrators" card) |
| `certificates/{uid}` | owner or admin | $5 claim: `pending_payment → paid → claimed`, serial, method, timestamps |
| `counters/certificates` | signed-in | atomic serial allocation |

Security is enforced by **`firestore.rules`** (repo root). Publish it from the Firebase
Console (Firestore Database → Rules) or `firebase deploy --only firestore:rules`.

> **Payment note:** the built-in $5 card checkout is a demo gateway (no card processor
> keys in this repo) and manual payments are approved by an admin in **Admin →
> Certificates**. For live charging, attach Stripe/PayPal and move payment finalization
> to a server webhook or Cloud Function that sets `status: "paid"` (the Upgrade
> Advisor tracks this as `rec-cert-stripe`).

## Authentication model (important)

- Users register / sign in with **Firebase Authentication** (email + password) on `/auth`.
- **The course requires registration**: `/lessons/:id`, `/certificate` and `/account` are
  locked until signed in. Progress/comments are bound to the user's Firebase `uid`.
- The server **verifies Firebase ID tokens** against Google's public certificates
  (`server/firebaseAuth.mjs`) — no service-account key in the repo.
- Admin rights = **a `role: "admin"` record in Firebase** (`users/{uid}.role`, assigned
  from the admin UI and mirrored to the public `admins/{uid}` registry that the student
  dashboard reads) **or** a token email on the **allowlist** (defaults:
  `seedwell@seedwel.com`, `seedwell@seedwelinvestment.com`, `zacheus@seedwelinvestment.com`,
  `admin@seedwel.com`; extend with the `ADMIN_EMAILS` env var, comma-separated) **or**
  a `role: "admin"` record in the REST server's `users` table (toggleable in the admin UI).
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
3. Create **Cloud Firestore** (Build → Firestore Database) and publish the repo's
   **`firestore.rules`** — course content becomes public-readable, role assignment is
   admin-only, and the certificate registry is locked to owner + management.
4. Sign in at `/admin`, open **Database Console → Publish Curriculum to Firestore**.
   Done — the course database, admin roles and the $5 certificate registry now run
   100% on Firebase. Everyone else who registers becomes a student.

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
| `/certificate` | **registered** | Official PDF certificate at 100% completion — **$5 claim** (tuition free), Firebase registry serial |
| `/account` | **registered** | Student dashboard: progress, ranks, certificate status, **admin-tab detection + who's assigned admin**, sign-out |
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

- **Frontend:** React 19, React Router 7, Tailwind CSS 4, lucide-react, jsPDF, Firebase JS SDK (Auth + Firestore)
- **Backend:** Express 5 on Node 22, deploys as a Vercel serverless function;
  Firebase ID-token verification with zero extra dependencies (`node:crypto` + Google certs)
- **True database:** **Cloud Firestore** — course catalog, user/admin roles, the $5
  certificate registry (`src/lib/firestore.ts`, rules in `firestore.rules`). The REST server's
  SQLite (`node:sqlite`) / Postgres / Vercel KV stores remain as resilient fallbacks
  (`server/storage.mjs`); content fetchers try Firestore → REST API → bundled seed
- **Content source of truth:** `src/data/content.json` (bundled seed; publish once to
  Firestore, then admin edits/Firestore console edits are live immediately)

> For educational purposes only. Not financial advice. Billionaire Blueprint is a
> tuition-free certification program of the Seedwel Certificate Incorporation — no
> school has been built; certificates carry a one-time $5 issuance fee.
