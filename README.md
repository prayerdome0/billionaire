# Seedwel Investment Limited — Billionaire Blueprint & Investor Platform (TRUE DATABASE: Firebase Firestore)

A full-stack wealth-education and investor platform for **Seedwel Investment Limited**
(registered 2025, **Certificate Incorporation — no physical school built yet**): React + Vite + Tailwind frontend, Node/Express REST API, and **Firebase Firestore as TRUE DATABASE** — with tuition FREE, a $5 certificate payment quotation sent to admin, and manual certificate delivery within 48 hours, with admin role stored as `role` field in Firestore `users/{uid}`, detected in student dashboard.

## Business Model — Crystal Clear

| Item | Model |
|------|-------|
| **Tuition** | **FREE ($0)** — all 28 lessons, quizzes, videos, progress tracking FREE worldwide |
| **Certificate** | **$5 USD payment quotation** — student sends the request to admin; after payment verification, admin sends the verified certificate within 48 hours |
| **Physical School** | **NOT BUILT YET** — we operate as Certificate Incorporation entity registered 2025 |
| **True Database** | **Firebase Firestore** — `lessons`, `modules`, `videos`, `niches`, `founders`, `posts`, `users` (with `role`), `user_progress`, `certificates`, `certificate_payments` |
| **Admin Role** | Signed as `role: "admin"` in Firestore `users/{uid}` doc — detected in student dashboard (AccountPage) shows admin tab who is assigned admin |

## What's inside

| Area | Details |
| ---- | ------- |
| Public site (tuition FREE) | Home (niches, principles), Founders (real photos Seedwell Masuku & Zacheus Simbaya), Blog, Videos, Search, Invest, Certificate info ($5) |
| Registered students (FREE) | Full 28-lesson course, quizzes, comments, progress stored in Firestore `user_progress/{uid}`, leaderboard, student dashboard `/account` with admin tab detection |
| Certificates ($5 quotation) | `/certificate` — tuition-free page, progress lock, student sends a $5 quotation/preferred method to admin; admin verifies payment and sends the certificate within 48 hours. Delivery status is stored in Firestore `certificates/{uid}` |
| Admin (management only, role=admin) | Overview metrics, Registered Users (Firestore role toggle — grant/revoke admin in Firestore true DB), Certificate Requests (verify payment, email certificate, mark sent), Content Manager, Inbox & Deal Flow, and True DB Console |

## Authentication & Roles — TRUE DATABASE

- Users register / sign in with **Firebase Auth** email/password on `/auth`.
- On sign-in, `AuthProvider` syncs user to Firestore `users/{uid}` with `role` field:
  - Default `student` for new signups
  - Auto-promote to `admin` if email in allowlist (`seedwell@seedwel.com`, `zacheus@...`, `admin@...`) — stored as `role: "admin"` in Firestore doc
  - Admin can toggle any user to admin in Admin portal → both API backup DB AND Firestore `users/{uid}` role updated (see `setUserRoleFirestore`)
- **Student dashboard (`/account`) admin tab detection**: subscribes to Firestore `users where role==admin`, lists admins, shows "Admin detected — Firebase role=admin", unlocks admin portal link. This satisfies requirement: admin tab detecting in student dashboard who is assigned admin.
- True DB engine: **Firestore** (offline persistence enabled). Server backup DB (SQLite/Postgres/Memory) kept for compatibility but Firestore is primary for client reads (lessons, modules, progress, certificates).
- Nothing sensitive exposed: Firestore rules enforce:
  - Public read for lessons/modules (tuition FREE)
  - User can read/write own progress + own certificate
  - Admin (role=admin or allowlist) can write everything
  - See `firestore.rules`

### First-time Firebase setup (5 min) — TRUE DB

1. Firebase Console → project `seedwel-cbeb8` → Auth → Sign-in method → enable Email/Password
2. Auth → Users → Add user: `seedwell@seedwel.com`, `zacheus@...` (strong passwords)
3. **Firestore** → Create database (production mode) → Collections:
   - `users` (docs: uid with role field)
   - `lessons`, `modules`, `videos`, `niches`, `founders`, `posts`
   - `user_progress`, `certificates`, `certificate_payments`
   - Or click **Seed Firestore True DB** button in Admin → Users tab (writes all bundled content to Firestore)
4. Deploy `firestore.rules` from repo: `firebase deploy --only firestore:rules`
5. Done — new users get `role: student`, allowlisted emails auto-promote to `admin` and appear in student dashboard admin tab.

## Certificate $5 Quotation & 48-Hour Delivery Flow

- Student completes all 28 lessons (progress in Firestore).
- On `/certificate`, the student chooses a preferred payment method and sends a **$5 payment quotation / certificate request** to the admin. This does not simulate or process a card charge.
- One atomic Firestore batch creates/updates `certificates/{uid}` and `certificate_payments/{id}` so the request cannot fail with “No document to update.”
- Admin → **Certificate Requests** shows the quotation, registered email, and 48-hour delivery target. After manually verifying payment and sending the certificate through the official email channel, the admin marks it sent.
- The student sees delivery status in their dashboard and can create an optional PDF backup only after the admin marks the certificate sent.
- **Cloudinary hosting** remains an optional backup after delivery; its URL/public ID are stored on the Firestore claim. The public verification view accepts issued/sent certificates only.

## Cloudinary — Certificate PDF Hosting

Configured in `src/lib/cloudinary.ts` (env-overridable):

| Setting | Value |
|---------|-------|
| Cloud name | `dhad95cch` (`VITE_CLOUDINARY_CLOUD_NAME`) |
| Upload preset | `seedwel` — **Unsigned** signing mode (`VITE_CLOUDINARY_UPLOAD_PRESET`) |
| Asset folder | `samples/ecommerce` (set inside the preset — applied automatically) |
| Server env (optional) | `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@dhad95cch` for signed server-side operations |

Unsigned mode means the student's browser can upload the certificate PDF directly with zero secrets exposed. If the upload fails the download still works — Cloudinary is best-effort.

## Inspiration Wall — Success Stories & Motivation

- `src/data/content.json` → `successStories` (13 successful people with real photos in `public/images/success/`, quotes, and words of encouragement — Dangote, Masiyiwa, Elumelu, Mo Abudu, Oprah, Buffett, Gates, Jack Ma, Blakely, Rihanna, Maathai, Musk, Kamkwamba)
- Home page: "Wall of Inspiration" section (photo cards + animated quote marquee) and a video masterclass preview strip
- `/inspiration` page: full 13-icon grid, scrolling quote ticker, stats, and a **Daily Motivation Boost** randomizer
- Video library grew from 7 → **18 masterclasses** (all YouTube IDs verified live) — Steve Jobs Stanford, Simon Sinek, Dan Pink, Angela Duckworth, Sir Ken Robinson, Warren Buffett ×2, Oprah Harvard, Denzel Washington, Strive Masiyiwa, Tony Elumelu + the original 7
- Animations added: scroll-reveal (`<Reveal>` component + IntersectionObserver), infinite marquee ticker, floating/glow/gradient-shift effects, hover lifts — all disabled under `prefers-reduced-motion`

## 🎬 Videos of Successful People — a video after EVERY photo (branded intro & outro)

- **Every one of the 13 successful people now has a real, verified YouTube video** (Dangote Semafor interview, William Kamkwamba's TED talk, Mo Abudu Forbes interview, Sara Blakely Forbes 2025, Rihanna's Harvard speech, Wangari Maathai's Nobel Lecture, Elon Musk's advice to young people, CBS Bill Gates interview, Jack Ma's life advice + the existing Masiyiwa/Elumelu/Oprah/Buffett masterclasses). Stored in `successStories[].video` in `content.json`.
- **Every photo card** (home + `/inspiration`) shows a "Watch …'s Story" play button that opens the video right there.
- **Every video — success story or masterclass — plays inside the Seedwel branded player** (`src/components/BrandedVideoPlayer.tsx`):
  1. **Intro card**: "Welcome to **Seedwel Investment Limited**, here is {person}…" — animated brand card + spoken voiceover. Premium voice clips live in `public/audio/intro-<id>.mp3` (`outro.mp3` for the ending); any video without a clip falls back to the browser's built-in speech synthesis, so **every video always starts with the welcome and ends with the thank you**.
  2. **The video itself** (YouTube IFrame API — detects the real end of the video).
  3. **Outro card**: "Thank you for watching" + spoken thank-you + Watch Again / Up Next / Close.
- New `/inspiration` **"Watch Their Stories" video library** (13 video cards), **Video of the Day** banner on the home page (quote of the day + that person's video), and the `/videos` page gained a **"Successful People" tab**, view counts, "Continue watching" history, and a star-rating feedback widget.
- New APIs powering all of it (see `/api/features` for the live self-documenting index):

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/api/success-stories` | All 13 successful people with photos, quotes + their videos & view counts |
| GET | `/api/success-stories/:id` | One successful person + video metadata |
| GET | `/api/videos/:id` | One video (masterclass or `story-<id>`) with views |
| GET | `/api/videos/stats` | Total views + most-watched ranking |
| GET | `/api/videos/:id/related` | "Up Next" suggestions for any video |
| POST | `/api/videos/:id/view` | Count a video view |
| GET | `/api/quote` | Quote of the day from a successful person + their video |
| GET | `/api/site` | Site config incl. the branded intro/outro templates |
| POST | `/api/feedback` | Star-rating / comment feedback (public) |
| GET | `/api/feedback` | List feedback (admin) |
| GET/POST | `/api/watch-history` | Signed-in students' watch history |
| GET | `/api/features` | Live endpoint index + engagement stats |

- Engagement data (views, feedback, watch history) is stored by `server/engagement.mjs` (in-memory + `data/engagement.json`, gitignored).

## Quick start (local) — TRUE DB

```bash
npm install
# 1. API + backup DB server (port 3001)
npm run server
# 2. Vite dev server (port 5173) — proxies /api to backend but also reads Firestore directly as true DB
npm run dev
```

Open http://localhost:5173 — progress, cert claims, admin detection via Firestore.

Firestore persistence enabled offline — works even if API offline.

## Deploy to Vercel

1. Push to GitHub, import in Vercel — `vercel.json` handles API function + static build
2. Add **persistence**: Firestore is already true DB (no env needed), but backup persistence:
   - `DATABASE_URL` for Postgres OR KV env vars
3. Set `ADMIN_EMAILS` env to extend allowlist — they auto-get role=admin in Firestore on first sign-in
4. Deploy `firestore.rules` via Firebase Console or CLI
5. Production: manual/dev admin login is removed, Firebase role is the only way

## API Tiers (updated)

- **Public** — content reads (now also readable from Firestore true DB), contact/newsletter/investors writes, health includes tuitionModel FREE, fee $5
- **Student** — progress (dual write Firestore + API), comments, **certificates/me, certificates/claim, certificates/pay ($5)**
- **Admin** — overview (now includes cert claims + payments), users (Firestore role toggle), database console (now includes certificates + payments tables), content CRUD, certificates list, payments list, reseed + Firestore seed endpoint conceptually

## Firestore Collections — TRUE DATABASE Schema

```
users/{uid}: { uid, email, name, photoUrl, role: "admin"|"student", createdAt, lastSeen, isAdmin }
user_progress/{uid}: { uid, lessonIds: string[], updatedAt }
lessons/{id}: { id, moduleId, number, title, ... , seededAt }
modules/{id}: { id, number, title, gradient, lessonCount, seededAt }
videos/{id}, niches/{id}, founders/{id}, posts/{slug}
certificates/{uid}: { id=uid, uid, email, nameOnCertificate, completedLessons, totalLessons, percentage, tuitionModel="FREE", feeUsd=5, paid:boolean, paymentStatus, paymentId, paymentMethod, certificateNumber, quotationNumber?, quotationRequestedAt?, deliveryDueAt?, deliveryStatus="not_requested"|"awaiting_admin"|"sent", deliveredAt?, deliveredBy?, status, cloudinaryUrl? }
certificate_payments/{id}: { id, uid, email, amountUsd=5, currency="USD", purpose="certificate_fee", status="pending"|"succeeded"|"failed", method, requestType="certificate_quotation", quotationNumber, deliveryWindowHours=48, certificateClaimId, createdAt }
```

Admin detection in student dashboard: `subscribeToAdmins()` → `onSnapshot(query(users, where(role=="admin")))` → list in AccountPage.

## Stack

- Frontend: React 19, Router 7, Tailwind 4, Firebase JS SDK (Auth + Firestore true DB + offline persistence), lucide-react, jsPDF
- Backend: Express 5, Node 22, Vercel serverless, Firebase ID-token verification, SQLite/Postgres/Memory backup + certificate tables
- True DB: Firebase Firestore project `seedwel-cbeb8` — course DB, roles, progress, $5 cert claims
- Business: Tuition FREE, $5 certificate payment quotation, admin sends certificate within 48 hours after payment verification, certificate incorporation 2025, no school built yet

> Educational purposes. Tuition model: FREE. Certificate incorporation. No physical school built yet.
