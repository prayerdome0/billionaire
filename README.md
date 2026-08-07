# Seedwel Investment Limited — Billionaire Blueprint & Investor Platform (TRUE DATABASE: Firebase Firestore)

A full-stack wealth-education and investor platform for **Seedwel Investment Limited**
(registered 2025, **Certificate Incorporation — no physical school built yet**): React + Vite + Tailwind frontend, Node/Express REST API, and **Firebase Firestore as TRUE DATABASE** — with tuition FREE, certificate $5 paid, admin role stored as `role` field in Firestore `users/{uid}`, detected in student dashboard.

## Business Model — Crystal Clear

| Item | Model |
|------|-------|
| **Tuition** | **FREE ($0)** — all 28 lessons, quizzes, videos, progress tracking FREE worldwide |
| **Certificate** | **$5 USD paid** — one-time fee for verified PDF, anti-forgery registry, incorporation admin, Firestore verification |
| **Physical School** | **NOT BUILT YET** — we operate as Certificate Incorporation entity registered 2025 |
| **True Database** | **Firebase Firestore** — `lessons`, `modules`, `videos`, `niches`, `founders`, `posts`, `users` (with `role`), `user_progress`, `certificates`, `certificate_payments` |
| **Admin Role** | Signed as `role: "admin"` in Firestore `users/{uid}` doc — detected in student dashboard (AccountPage) shows admin tab who is assigned admin |

## What's inside

| Area | Details |
| ---- | ------- |
| Public site (tuition FREE) | Home (niches, principles), Founders (real photos Seedwell Masuku & Zacheus Simbaya), Blog, Videos, Search, Invest, Certificate info ($5) |
| Registered students (FREE) | Full 28-lesson course, quizzes, comments, progress stored in Firestore `user_progress/{uid}`, leaderboard, student dashboard `/account` with admin tab detection |
| Certificates ($5 paid) | `/certificate` — tuition free page, progress lock, $5 payment modal (card/PayPal/MoMo), paid unlock, PDF generation with incorporation note, stored in Firestore `certificates/{uid}` |
| Admin (management only, role=admin) | Overview metrics, Registered Users (Firestore role toggle — grant/revoke admin in Firestore true DB), Certificates ($5 claims, paid/unpaid, revenue), Content Manager (CRUD lessons etc -> writes to Firestore + backup DB), Inbox & Deal Flow, True DB Console (browse every table incl certificates/payments, seed Firestore), Advisor (new: Firestore true DB completed, certificate $5 model completed) |

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

## Certificate $5 Paid Flow

- Student completes 28 lessons (progress in Firestore)
- `/certificate` page shows: tuition FREE banner, incorporation note (no school built yet), progress, certificate preview
- Payment methods: card (Stripe-like), PayPal, Mobile Money — currently mock (95% success, 1.8s delay) — replace `processMockPayment` in `certificateService.ts` with Stripe Checkout in production
- On payment success: `markCertificatePaid` updates Firestore `certificates/{uid}` paid=true, paymentId, status=claimed, plus `certificate_payments` record
- PDF generation includes: certificate number `SWL-YYYYMMDD-XXXXX-XXXX`, incorporation note, tuition FREE / $5 paid, Firestore verified, admin role detection note
- Admin portal → Certificates tab shows all claims, paid/unpaid, revenue = paidCount * $5

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
5. Production: dev admin login (`seed@admin` / `122023`) hard-disabled, Firebase role only

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
certificates/{uid}: { id=uid, uid, email, nameOnCertificate, completed, total, pct, tuitionModel="FREE", feeUsd=5, paid:boolean, paymentStatus, paymentId, certificateNumber, incorporationNote, status, claimedAt, issuedAt }
certificate_payments/{id}: { id, uid, email, amountUsd=5, currency="USD", purpose="certificate_fee", status, method, certificateClaimId, createdAt }
```

Admin detection in student dashboard: `subscribeToAdmins()` → `onSnapshot(query(users, where(role=="admin")))` → list in AccountPage.

## Stack

- Frontend: React 19, Router 7, Tailwind 4, Firebase JS SDK (Auth + Firestore true DB + offline persistence), lucide-react, jsPDF
- Backend: Express 5, Node 22, Vercel serverless, Firebase ID-token verification, SQLite/Postgres/Memory backup + certificate tables
- True DB: Firebase Firestore project `seedwel-cbeb8` — course DB, roles, progress, $5 cert claims
- Business: Tuition FREE, certificate $5 paid, certificate incorporation 2025, no school built yet

> Educational purposes. Tuition model: FREE. Certificate incorporation. No physical school built yet.
