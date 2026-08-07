# Firebase TRUE DATABASE Migration — Summary

## What changed (user request)

> "This is amazing now let's update course database let's use firebase I want true database and certificate  
> Admin should be signed as role in firebase, admin tab detecting in student dashboard who is assigned admin, certificate should be paid $5 for someone to claim but tuition it's free, we've not built any school, we have certificate incorporation"

## Implementation

### 1. Firebase as TRUE DATABASE

- **File**: `src/lib/firebase.ts`
  - Added `getFirestore`, export `db`, enabled IndexedDB offline persistence.
  - Constants: `CERTIFICATE_FEE_USD=5`, `TUITION_MODEL="FREE"`.

- **New File**: `src/lib/firestoreDb.ts` — canonical DB layer:
  - Collections: `lessons`, `modules`, `videos`, `niches`, `founders`, `posts`, `users` (with role field), `user_progress`, `certificates`, `certificate_payments`.
  - Functions:
    - `fetchLessonsFromFirestore`, `fetchModulesFromFirestore`, etc. — Firestore first, fallback bundled JSON.
    - `ensureUserDoc`, `getUserRole`, `setUserRoleFirestore`, `listAllUsersFirestore`, `subscribeToAdmins`, `subscribeToUsers` — admin role signed as role field.
    - `getProgressFirestore`, `setProgressFirestore`, `subscribeToProgress` — progress true DB.
    - `getCertificateStatus`, `createOrUpdateCertificateClaim`, `submitCertificateQuotation`, `markCertificateSentByAdmin`, `listCertificatesFirestore` — $5 quotation + manual delivery model.
    - `seedFirestoreFromBundledContent` — admin can seed true DB with bundled curriculum.
    - `leaderboardFromFirestore`, `certificateIncorporationNote`, `genCertificateNumber`.

- **File**: `firestore.rules` — Enforces:
  - Public read for course content (tuition FREE).
  - Users can read own doc + write own progress/certificate (unpaid initially).
  - Admin (role=admin OR email allowlist) can write all.
  - Certificates: $5 quotation is submitted by the student; only admin can verify payment and mark delivery sent.

- **Server backup**: `server/storage.mjs` now includes `certificates` + `certificate_payments` tables for all engines (SQLite, Postgres, Memory, KV). True DB is Firestore, backup kept for compatibility. Admin tables list now includes those.

### 2. Admin role signed as role in Firebase, admin tab detecting in student dashboard

- **File**: `src/lib/auth.tsx`
  - On auth state change, syncs to Firestore `users/{uid}` with role field.
  - Auto-promotes allowlisted emails to `role=admin` in Firestore.
  - Reads Firestore role doc to determine `isAdmin` (in addition to server allowlist).
  - Exposes `firestoreUser` with role.

- **File**: `src/pages/AccountPage.tsx` (student dashboard) — **admin tab detecting**:
  - Shows incorporation banner (no school built yet, tuition FREE, cert $5).
  - Detects admin via Firestore role, shows "Management • Admin (Firestore role)" badge.
  - New **Admin Tab section** when `isAdmin`: lists total registered, admins count, true DB engine, link to full admin portal, and live list of all admins from Firestore (real-time `subscribeToAdmins`).
  - Shows certificate quotation, admin-queue, and sent status from Firestore `certificates/{uid}`.
  - Progress fetched from Firestore first (`getProgressFirestore`).
  - Firestore role shown as `Firestore role: admin`.

- **File**: `src/pages/AdminPage.tsx`
  - Certificate tabs show $5 claims, the admin quotation queue, sent status, and payment-verified revenue.
  - Users tab now shows Firestore users (role field) and can toggle role via **both API + Firestore** (`setUserRoleFirestore`).
  - Adds button **Seed Firestore True DB** (writes 28 lessons etc to Firestore).
  - Overview: metrics for Firestore admins, certificate claims, paid revenue.
  - Database console now includes certificates + payments tables.
  - Login screen explains Firestore role field.

### 3. Certificate $5 quotation, tuition FREE, incorporation model

- **File**: `src/lib/certificateService.ts`
  - Constants: `CERTIFICATE_FEE=5`, `CERTIFICATE_DELIVERY_HOURS=48` and the incorporation message.
  - `sendCertificateQuotationToAdmin()` creates a $5 quotation/request; `adminMarkCertificateSent()` records payment verification and manual delivery.
  - No browser-side mock charge is performed.

- **File**: `src/pages/CertificatePage.tsx`
  - Eligible students choose Card, PayPal, or MoMo as a **preferred payment method** and send a $5 quotation to the admin queue.
  - The claim and quotation record are written in one Firestore batch. Optional values are stripped before writing, fixing the prior `No document to update` chain.
  - The UI states that the admin sends the certificate to the registered email within 48 hours after payment verification.
  - A PDF/Cloudinary backup is available only after admin marks the certificate sent.

- **File**: `src/utils/generateCertificate.ts`
  - PDF now includes: "SEEDWEL INVESTMENT LIMITED • CERTIFICATE INCORPORATION • EST. 2025 • NO SCHOOL BUILT YET", "TUITION FREE • CERTIFICATE $5 PAID", Firestore true DB note, role detection note, certificate number SWL-YYYYMMDD-XXXXX-XXXX.

- **File**: `server/app.mjs`
  - Health + stats now include `tuitionModel: FREE`, `certificateFeeUsd: 5`, `trueDatabase: Firestore`.
  - New endpoints:
    - `GET /api/certificates/me` — own cert
    - `POST /api/certificates/claim` — create claim (tuition FREE)
    - `POST /api/certificates/pay` — create a pending $5 quotation for legacy API consumers (no mock charge)
    - `GET /api/certificates` (admin), `GET /api/certificate-payments` (admin)
  - Admin overview includes certificates + payments + incorporation note + true DB note.
  - Recommendations now include "Firestore true DB completed", "Certificate $5 model completed".

- **File**: `src/lib/api.ts`
  - Now tries Firestore first for lessons, modules, founders, videos, niches.
  - Progress: Firestore first, then API fallback, dual write.
  - Leaderboard: Firestore first.
  - New helpers: `fetchMyCertificate`, `fetchFirestoreUsers`.

### 4. Environment & Docs

- `.env.example` — documents Firestore true DB, certificate $5 fee, tuition FREE, incorporation note, Stripe/PayPal/MoMo placeholders, Firestore rules reference.
- `README.md` — rewritten to explain true DB, tuition FREE / cert $5 model, admin role detection, Firestore schema, certificate flow.
- `firestore.rules` — full rules file implementing FREE tuition public read, admin role field, $5 cert enforcement.

### 5. Build Verified

- `npm run build` (Vite) succeeds: 2.2MB singlefile (includes Firebase).
- No TypeScript errors (uses JS fallback where needed).

## How to test

1. Sign up free account → `/account` shows "Registered Student • FREE tuition", Firestore role = student, progress stored in Firestore `user_progress/{uid}`.
2. Complete lessons (free) → progress bar updates in Firestore (real-time possible).
3. Finish 28 lessons → `/certificate` unlocks and shows the $5 quotation form plus incorporation note.
4. Choose a preferred method and send the quotation → Firestore atomically stores the certificate claim and pending `certificate_payments` request. Admin verifies payment, emails the certificate within 48 hours, then marks it sent. The student may create an optional Cloudinary-hosted backup after delivery.
5. Create second account with admin email (allowlist) → auto-promoted to role=admin in Firestore, student dashboard shows admin tab with list of admins, true DB engine = Firestore.
6. Go to `/admin` → Certificate Requests shows pending quotations; email the student manually, then use **Mark Certificate Sent**. The Certificates tab shows sent/queued status; True DB Console shows backup tables.
7. Firestore console → users collection → role field controls admin, certificates collection holds $5 claims.

## Next production steps

- Optional: add Stripe Checkout, PayPal, or Mobile Money collection while retaining the admin verification and manual delivery queue.
- Connect an approved transactional email provider if automatic mail delivery is required; until then the admin mail workflow is explicit.
- Deploy `firestore.rules` via `firebase deploy`.
- Optional: set `DATABASE_URL` for Postgres backup, but Firestore remains true DB.

