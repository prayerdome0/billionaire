# Billionaire Blueprint — Wealth Curriculum Platform

A full-stack wealth-education platform: a React + Vite + Tailwind frontend backed by a
Node.js REST API and a SQLite database. Contains a 28-lesson curriculum, video
masterclasses, founder profiles with photos, lesson progress tracking, a contact/messaging
system, and a live API explorer — all served from the same database.

## Quick start

```bash
npm install

# 1. Start the API + database server (port 3001)
npm run server

# 2. In another terminal, start the Vite dev server (port 5173)
npm run dev
```

Open http://localhost:5173 — the frontend proxies `/api/*` to the backend.

## Production

```bash
npm run build     # builds the SPA into dist/
npm start         # serves dist/ + API on one port (default 3001)
```

Set `PORT` to change the port. The SQLite database is created automatically at
`data/billionaire.db` and seeded from `src/data/content.json` on first run
(`RESEED=1 npm run server` to force a re-seed).

## Pages

| Route              | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `/`                | Home: niches, principles, steps, gallery, PDF download             |
| `/lessons`         | Full 28-lesson curriculum across 6 modules, with live progress     |
| `/lessons/:id`     | Lesson detail: content, takeaways, action steps, quiz, completion  |
| `/videos`          | 7 video masterclasses, playable in-page (YouTube embeds)           |
| `/founders`        | Founder profiles with photos, testimonials, contact form           |
| `/api-docs`        | Live API explorer + database inspector                             |

## API

The REST API (see `/api-docs` in the app for the full explorer):

- `GET /api/health` — liveness, db engine, table counts
- `GET /api/stats` — aggregate counts across the site
- `GET /api/database` — raw table + row counts, recent writes
- `GET /api/founders`, `GET /api/founders/:id`
- `GET /api/modules`
- `GET /api/lessons`, `GET /api/lessons/:id`
- `GET /api/videos`
- `GET /api/niches`, `GET /api/niches/:id`
- `POST /api/contact`, `GET /api/contact` — message inbox (database writes)
- `POST /api/progress`, `GET /api/progress?clientId=…`, `DELETE /api/progress` —
  lesson completion tracking (database writes)

## Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS 4, lucide-react
- **Backend:** Express 5 on Node 22 (zero native modules)
- **Database:** SQLite via Node's built-in `node:sqlite`
- **Content source of truth:** `src/data/content.json` (used by the frontend and
  the DB seeder)

> For educational purposes only. Not financial advice.
