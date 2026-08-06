# Billionaire Blueprint — Wealth Curriculum Platform

A full-stack wealth-education platform: a React + Vite + Tailwind frontend backed by a
Node.js REST API and a database. Includes a 28-lesson curriculum, video masterclasses,
founder profiles with photos, lesson progress tracking, comments & leaderboard, blog &
newsletter, a completion certificate (PDF), site-wide search, and a live API explorer.

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
`src/data/content.json` on first run (`RESEED=1 npm run server` to force a re-seed).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — the `vercel.json` config handles everything:
   - `api/index.mjs` becomes a serverless function (Express app)
   - `dist/` is built via `npm run build` and served as static files
   - Rewrites send `/api/*` to the function and everything else to the SPA
3. **(Recommended) Add persistence** — connect any of these in Vercel and the API
   auto-detects it (no code changes):
   - **Vercel KV** (Upstash Redis) — free tier — auto-detected via `KV_REST_API_URL` + `KV_REST_API_TOKEN`
   - **Vercel Postgres / Neon / Supabase** — auto-detected via `DATABASE_URL`
   - Without either, the API falls back to an in-memory store: everything still works,
     but progress/comments/subscribers reset when functions cold-start.

Storage selection order: `DATABASE_URL` → KV env vars → in-memory (serverless) / SQLite (local).

## Pages

| Route                | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `/`                  | Home: niches, principles, steps, gallery, blog preview, PDF guide  |
| `/lessons`           | 28-lesson curriculum across 6 modules, live progress, leaderboard  |
| `/lessons/:id`       | Lesson detail: content, takeaways, action steps, quiz, comments    |
| `/videos`            | 7 video masterclasses, playable in-page (YouTube embeds)           |
| `/founders`          | Founder profiles with photos, testimonials, contact form           |
| `/blog`              | Founder articles + newsletter signup                               |
| `/blog/:slug`        | Blog post detail                                                    |
| `/certificate`       | Official PDF certificate at 100% completion                        |
| `/search`            | Site-wide search across lessons, videos, niches, founders, posts   |
| `/api-docs`          | Live API explorer + database inspector                             |

## API

The REST API (explore it live on `/api-docs`):

- `GET /api/health`, `GET /api/stats`, `GET /api/database`
- `GET /api/founders[/:id]`, `GET /api/modules`, `GET /api/lessons[/:id]`
- `GET /api/videos`, `GET /api/niches[/:id]`, `GET /api/posts[/:slug]`
- `GET /api/search?q=…`
- `POST/GET /api/contact` — contact form (database write)
- `POST/GET /api/comments?lessonId=…` — lesson discussions (database write)
- `GET /api/leaderboard`
- `POST/GET /api/newsletter` — newsletter subscribers (database write)
- `POST/GET/DELETE /api/progress` — lesson completion tracking (database write)

## Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS 4, lucide-react, jsPDF
- **Backend:** Express 5 on Node 22, deploys as a Vercel serverless function
- **Database:** SQLite (`node:sqlite`) locally; Postgres or Vercel KV on Vercel — one
  storage abstraction in `server/storage.mjs`
- **Content source of truth:** `src/data/content.json` (used by the frontend and the
  DB seeder, and bundled into the serverless function)

> For educational purposes only. Not financial advice.
