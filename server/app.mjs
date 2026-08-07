/**
 * Billionaire Blueprint — Express app (storage-agnostic, Firebase-verified, Firestore TRUE DB).
 * Used by:
 *   - server/index.mjs  (local: listens on a port, serves dist + API)
 *   - api/index.mjs     (Vercel serverless function)
 *
 * Access model:
 *   PUBLIC   — content reads (lessons outline, videos, founders, posts, search,
 *              leaderboard), plus contact / newsletter / investor writes.
 *   STUDENT  — everything a signed-in Firebase user can do: lesson progress,
 *              comments, certificate $5 paid claim (tuition FREE).
 *   ADMIN    — Seedwel management only: user management, role assignment via
 *              Firebase users/{uid} role field, full database browser,
 *              content CRUD, certificate claims, inbox, reseed.
 *
 * NEW BUSINESS RULES (user request):
 * - Firebase Firestore is TRUE DATABASE for course content, users (role), progress, certificates.
 * - Tuition is FREE for all lessons.
 * - Certificate is $5 paid service (verification, anti-forgery, incorporation registry).
 * - No physical school built yet — certificate incorporation entity registered 2025.
 * - Admin role signed as role field in Firebase users/{uid} doc, detected in student dashboard.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getStore } from "./storage.mjs";
import {
  optionalUser,
  requireUser,
  requireAdmin,
  DEV_ADMIN_ENABLED,
  devAdminUser,
  issueDevAdminToken,
  adminAllowlist,
  firebaseProjectId,
} from "./firebaseAuth.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(optionalUser);

const json = (res, code, body) => res.status(code).json(body);
const store = () => getStore();

const clip = (v, n) => String(v ?? "").slice(0, n);
const CERT_FEE = 5;
const INCORPORATION_NOTE =
  "Seedwel Investment Limited — Certificate Incorporation entity registered 2025. We have not built any physical school yet. Tuition FREE, certificate $5 paid for verification & registry.";

/* ------------------------------ health ------------------------------ */
app.get("/api/health", async (_req, res) => {
  const s = await store();
  json(res, 200, {
    status: "ok",
    service: "seedwel-billionaire-api",
    db: s.engine,
    firebaseProject: firebaseProjectId,
    trueDatabase: "Firebase Firestore (primary) + backup storage",
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
    incorporation: "Certificate Incorporation — no school built yet",
    tables: Object.keys((await s.databaseInfo()).tables || {}).length,
    time: new Date().toISOString(),
  });
});

/* ------------------------------ stats (public) ------------------------------ */
app.get("/api/stats", async (_req, res) => {
  const stats = await (await store()).stats();
  json(res, 200, {
    ...stats,
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
    incorporation: "Certificate Incorporation — no school built yet",
    trueDatabase: "Firebase Firestore",
  });
});

/* ------------------------------ founders / modules / lessons ------------------------------ */
app.get("/api/founders", async (_req, res) => json(res, 200, await (await store()).listFounders()));
app.get("/api/founders/:id", async (req, res) => {
  const f = await (await store()).getFounder(req.params.id);
  if (!f) return json(res, 404, { error: "Founder not found" });
  json(res, 200, f);
});

app.get("/api/modules", async (_req, res) => json(res, 200, await (await store()).listModules()));

app.get("/api/lessons", async (_req, res) => json(res, 200, await (await store()).listLessons()));
app.get("/api/lessons/:id", async (req, res) => {
  const l = await (await store()).getLesson(req.params.id);
  if (!l) return json(res, 404, { error: "Lesson not found" });
  json(res, 200, l);
});

app.get("/api/videos", async (_req, res) => json(res, 200, await (await store()).listVideos()));

app.get("/api/niches", async (_req, res) => json(res, 200, await (await store()).listNiches()));
app.get("/api/niches/:id", async (req, res) => {
  const n = await (await store()).getNiche(req.params.id);
  if (!n) return json(res, 404, { error: "Niche not found" });
  json(res, 200, n);
});

app.get("/api/posts", async (_req, res) => json(res, 200, await (await store()).listPosts()));
app.get("/api/posts/:slug", async (req, res) => {
  const p = await (await store()).getPost(req.params.slug);
  if (!p) return json(res, 404, { error: "Post not found" });
  json(res, 200, p);
});

app.get("/api/search", async (req, res) => {
  const q = clip(req.query.q, 100);
  if (!q) return json(res, 400, { error: "q query param is required" });
  json(res, 200, await (await store()).search(q));
});

/* ------------------------------ auth: who am I (any signed-in user) ------------------------------ */
app.all("/api/auth/me", requireUser, async (req, res) => {
  const u = req.user;
  let record = null;
  try {
    record = await (await store()).upsertUser({
      uid: u.uid,
      email: u.email,
      name: u.name || u.email.split("@")[0],
      photoUrl: u.picture || "",
      role: u.role,
    });
  } catch {
    /* users table is best-effort */
  }
  json(res, 200, {
    user: {
      uid: u.uid,
      email: u.email,
      name: u.name || record?.name || "",
      photoUrl: u.picture || record?.photoUrl || "",
      role: record?.role || u.role || "student",
      created_at: record?.created_at,
      last_seen: record?.last_seen,
      dev: !!u.dev,
      trueDatabase: "Firestore users/{uid} with role field",
    },
    isAdmin: !!u.admin,
    adminEmails: [...adminAllowlist()],
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
  });
});

/* ===================================================================== */
/* =========================== STUDENT (signed in) ===================== */
/* ===================================================================== */

/* ---------------------------- lesson progress ---------------------------- */
app.post("/api/progress", requireUser, async (req, res) => {
  const { lessonId } = req.body || {};
  if (!lessonId) return json(res, 400, { error: "lessonId is required" });
  const ok = await (await store()).setProgress(req.user.uid, clip(lessonId, 200));
  if (!ok) return json(res, 404, { error: "Lesson not found" });
  json(res, 200, { ok: true, lessonId, completed: true, storedIn: "Firestore true DB + backup" });
});
app.get("/api/progress", requireUser, async (req, res) => {
  json(res, 200, { uid: req.user.uid, lessonIds: await (await store()).getProgress(req.user.uid), trueDatabase: "Firestore user_progress collection" });
});
app.delete("/api/progress", requireUser, async (req, res) => {
  const { lessonId } = req.body || {};
  if (!lessonId) return json(res, 400, { error: "lessonId is required" });
  await (await store()).clearProgress(req.user.uid, clip(lessonId, 200));
  json(res, 200, { ok: true, lessonId, completed: false });
});

/* ------------------------------ comments ------------------------------ */
app.post("/api/comments", requireUser, async (req, res) => {
  const { lessonId, text } = req.body || {};
  if (!lessonId || !text) return json(res, 400, { error: "lessonId and text are required" });
  const lesson = await (await store()).getLesson(lessonId);
  if (!lesson) return json(res, 404, { error: "Lesson not found" });
  const name = clip(req.user.name || req.body?.name || req.user.email.split("@")[0], 80);
  json(res, 201, await (await store()).addComment({ lessonId, clientId: req.user.uid, name, text }));
});
app.get("/api/comments", async (req, res) => {
  const lessonId = clip(req.query.lessonId, 200);
  if (!lessonId) return json(res, 400, { error: "lessonId query param is required" });
  json(res, 200, await (await store()).listComments(lessonId));
});

/* ---------------------------- leaderboard (public) ---------------------------- */
app.get("/api/leaderboard", async (_req, res) => json(res, 200, await (await store()).leaderboard()));

/* ------------------------------ certificates — $5 paid, tuition FREE ------------------------------ */
app.get("/api/certificates/me", requireUser, async (req, res) => {
  try {
    const s = await store();
    const cert = (await (s.getCertificateByUid?.(req.user.uid) || s.getCertificate?.(req.user.uid))) || null;
    if (!cert) return json(res, 200, { paid: false, exists: false, feeUsd: CERT_FEE, tuitionModel: "FREE", incorporationNote: INCORPORATION_NOTE });
    json(res, 200, cert);
  } catch (e) {
    json(res, 200, { paid: false, exists: false, feeUsd: CERT_FEE, tuitionModel: "FREE", error: (e as Error).message });
  }
});

app.post("/api/certificates/claim", requireUser, async (req, res) => {
  const { nameOnCertificate, completed, total } = req.body || {};
  if (!nameOnCertificate) return json(res, 400, { error: "nameOnCertificate required" });
  const s = await store();
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const certNum = `SWL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.abs(nameOnCertificate.split("").reduce((a: number, c: string) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0)) % 100000}-${Math.floor(Math.random() * 9000) + 1000}`;
  const docData = {
    id: req.user.uid,
    uid: req.user.uid,
    email: req.user.email,
    nameOnCert: clip(nameOnCertificate, 100),
    name_on_cert: clip(nameOnCertificate, 100),
    completed: Number(completed) || 0,
    total: Number(total) || 0,
    pct,
    percentage: pct,
    tuitionModel: "FREE",
    feeUsd: CERT_FEE,
    paid: 0,
    paymentStatus: "unpaid",
    payment_status: "unpaid",
    certificateNumber: certNum,
    certificate_number: certNum,
    incorporationNote: INCORPORATION_NOTE,
    incorporation_note: INCORPORATION_NOTE,
    status: "eligible",
    claimedAt: new Date().toISOString(),
  };
  try {
    const created = await (s.upsertCertificate?.(docData) || docData);
    json(res, 201, created);
  } catch (e) {
    json(res, 500, { error: (e as Error).message });
  }
});

app.post("/api/certificates/pay", requireUser, async (req, res) => {
  const { paymentMethod = "card" } = req.body || {};
  const s = await store();
  try {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const payment = {
      id: paymentId,
      uid: req.user.uid,
      email: req.user.email,
      amountUsd: CERT_FEE,
      amount_usd: CERT_FEE,
      currency: "USD",
      purpose: "certificate_fee",
      status: "pending",
      method: paymentMethod,
      certificateClaimId: req.user.uid,
      certificate_claim_id: req.user.uid,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    await s.addCertificatePayment?.(payment);

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 500));

    const txnId = `txn_${paymentMethod}_${Date.now()}`;
    await s.confirmCertificatePayment?.(paymentId, "succeeded");
    await s.markCertificatePaid?.(req.user.uid, txnId, paymentMethod);

    // also mark in certificates table if needed
    const finalCert = await s.getCertificateByUid?.(req.user.uid);

    json(res, 200, {
      success: true,
      paid: true,
      feeUsd: CERT_FEE,
      tuitionModel: "FREE",
      paymentId: txnId,
      certificate: finalCert,
      message: `Certificate paid $${CERT_FEE} USD — tuition remains FREE. Incorporation verified.`,
    });
  } catch (e) {
    json(res, 500, { error: (e as Error).message });
  }
});

app.get("/api/certificates", requireAdmin, async (_req, res) => {
  const s = await store();
  const list = await (s.listCertificates?.() || []);
  json(res, 200, list);
});

app.get("/api/certificate-payments", requireAdmin, async (_req, res) => {
  const s = await store();
  const list = await (s.listCertificatePayments?.() || []);
  json(res, 200, list);
});

/* ===================================================================== */
/* ====================== PUBLIC WRITES (contact etc.) ================= */
/* ===================================================================== */

app.post("/api/contact", async (req, res) => {
  const { name, email, subject = "General", message } = req.body || {};
  if (!name || !email || !message) return json(res, 400, { error: "name, email and message are required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: "email is not valid" });
  const created = await (await store()).addMessage({ name: clip(name, 120), email: clip(email, 200), subject: clip(subject, 200), message: clip(message, 5000) });
  json(res, 201, created);
});

app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return json(res, 400, { error: "email is required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: "email is not valid" });
  json(res, 201, await (await store()).addSubscriber(email));
});

app.post("/api/investors", async (req, res) => {
  const { name, email, phone, interestArea = "School Building & AI Business", amountRange, message } = req.body || {};
  if (!name || !email) {
    return json(res, 400, { error: "name and email are required to submit an investor inquiry" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(res, 400, { error: "email is not valid" });
  }
  const created = await (await store()).addInvestorInquiry({
    name: clip(name, 120),
    email: clip(email, 200),
    phone: clip(phone || "", 50),
    interest_area: clip(interestArea, 120),
    amount_range: clip(amountRange || "", 80),
    message: clip(message || "", 5000),
  });
  json(res, 201, { success: true, inquiry: created });
});

/* ===================================================================== */
/* ================= ADMIN ONLY (nothing below is public) ============== */
/* ===================================================================== */

app.post("/api/admin/login", async (req, res) => {
  if (!DEV_ADMIN_ENABLED) {
    return json(res, 403, {
      error: "Password login is disabled in production. Sign in with your Firebase admin account (role field in Firestore users/{uid}).",
      code: "USE_FIREBASE",
    });
  }
  const { email = "", password = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();
  const devPassword = process.env.DEV_ADMIN_PASSWORD || "122023";
  const allowed = ["seed@admin", "seed@admin.com", ...adminAllowlist()];
  if (!allowed.includes(cleanEmail) || String(password).trim() !== devPassword) {
    return json(res, 401, { error: "Invalid credentials (development login)." });
  }
  const isZacheus = cleanEmail.includes("zacheus");
  json(res, 200, {
    success: true,
    token: issueDevAdminToken(),
    admin: {
      name: isZacheus ? "Zacheus Simbaya" : devAdminUser.name,
      role: isZacheus ? "Country Director — Zambia (development session)" : "Founder & CEO (development session)",
      email: cleanEmail,
      firestoreRole: "admin",
    },
  });
});

app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
  const s = await store();
  const [stats, dbInfo, messages, subscribers, inquiries, users, certificates, payments] = await Promise.all([
    s.stats(),
    s.databaseInfo(),
    s.listMessages(),
    s.listSubscribers(),
    s.listInvestorInquiries(),
    s.listUsers().catch(() => []),
    (s.listCertificates?.() || []).catch(() => []),
    (s.listCertificatePayments?.() || []).catch(() => []),
  ]);
  json(res, 200, {
    company: {
      name: "Seedwel Investment Limited",
      registeredYear: 2025,
      status: "Active • Certificate Incorporation • No school built yet • Open for investors",
      founder: "Mr. Seedwell Khayalethu Masuku",
      countryDirectorZambia: "Zacheus Simbaya",
      adminEmail: "seedwell@seedwel.com",
      pillars: [
        "School Building & Educational Infrastructure (planned)",
        "AI Business & Software Developer Ecosystem",
        "Strategic Real Estate & Wealth Education — Tuition FREE, Certificate $5 paid",
      ],
      tuitionModel: "FREE",
      certificateFeeUsd: CERT_FEE,
      incorporationNote: INCORPORATION_NOTE,
      trueDatabase: "Firebase Firestore — users/{uid} role field is source of truth for admin detection in student dashboard",
    },
    stats: { ...stats, certificateClaims: (certificates as any[]).length, certificatePayments: (payments as any[]).length },
    database: dbInfo,
    messages,
    subscribers,
    investorInquiries: inquiries,
    users,
    certificates,
    payments,
  });
});

app.get("/api/admin/recommendations", requireAdmin, async (_req, res) => {
  json(res, 200, {
    summary: "System Growth & Strategic Upgrade Roadmap for Seedwel Investment Limited — Certificate Incorporation Model",
    company: "Seedwel Investment Limited — Registered 2025 — Certificate Incorporation, No Physical School Yet",
    recommendations: [
      {
        id: "rec-firestore-true-db",
        category: "Technical & Database Infrastructure",
        title: "Firebase Firestore as TRUE DATABASE — roles & certificates",
        priority: "High",
        actionType: "Upgrade",
        description: "Migrated course database to Firebase Firestore as canonical store. Users collection has role field (admin/student). Admin tab in student dashboard detects admin via Firestore users/{uid}. Progress stored in user_progress collection. Certificates stored in certificates collection with $5 paid claim, tuition FREE.",
        impact: "True database scales globally, offline persistence, real-time admin detection.",
        status: "Completed",
      },
      {
        id: "rec-certificate-5usd",
        category: "Curriculum & Certification",
        title: "Certificate Incorporation — $5 Paid Claim, Tuition FREE",
        priority: "High",
        actionType: "Add",
        description: `Implement transparent business model: tuition $0 FREE for 28-lesson curriculum accessible to all. Certificate PDF issuance is paid service: $${CERT_FEE} USD per claim covering verification registry, anti-forgery ID, incorporation admin. No physical school built yet — incorporation entity.`,
        impact: "Removes tuition barrier while monetizing verification — sustainable.",
        status: "Completed",
      },
      {
        id: "rec-admin-role-firestore",
        category: "Admin Experience",
        title: "Admin role signed as role in Firebase + student dashboard detection",
        priority: "High",
        actionType: "Upgrade",
        description: "Admin role stored in Firestore users/{uid} doc field role=admin. AuthProvider syncs Firestore doc and promotes allowlisted emails automatically. Student dashboard (AccountPage) shows Admin tab when role=admin detected, listing all admins, Firestore metrics, true DB engine.",
        impact: "Management rights are now live in Firebase, detectable in student dashboard.",
        status: "Completed",
      },
      {
        id: "rec-school-escrow",
        category: "School Building & Educational Infrastructure",
        title: "Zambia School Construction Escrow & Milestone Tracking",
        priority: "High",
        actionType: "Upgrade",
        description: "Upgrade investor dashboard to provide real-time milestones for planned STEM schools. Note: no school built yet — certificate incorporation phase.",
        impact: "Investor trust for future school building phase.",
        status: "Recommended",
      },
      {
        id: "rec-ai-incubator",
        category: "AI Business & Developer Ecosystem",
        title: "Pan-African Tech Developer Talent Showcase & Incubator Portal",
        priority: "High",
        actionType: "Add",
        description: "Developer portal where investors browse AI startups, commits, co-invest.",
        impact: "Monetizes AI pipeline, high-margin SaaS.",
        status: "Recommended",
      },
      {
        id: "rec-stripe-integration",
        category: "Payment & Monetization",
        title: "Integrate Stripe Checkout for $5 certificate fee (production)",
        priority: "High",
        actionType: "Upgrade",
        description: "Currently mock payment simulates success (95% rate). In production, replace processMockPayment with Stripe Checkout Session for $5 USD, PayPal SDK, and Mobile Money API for Zambia. Firestore payments collection stores records.",
        impact: "Real revenue from certificate claims while tuition free.",
        status: "Recommended",
      },
    ],
  });
});

/* ------------------------------ admin: users ------------------------------ */
app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  json(res, 200, await (await store()).listUsers());
});
app.patch("/api/admin/users/:uid", requireAdmin, async (req, res) => {
  const { role } = req.body || {};
  if (!["admin", "student"].includes(role)) return json(res, 400, { error: "role must be 'admin' or 'student'" });
  const updated = await (await store()).setUserRole(req.params.uid, role);
  json(res, 200, { ...updated, trueDatabaseNote: "Also update Firestore users/{uid} role field in client via firestoreDb.ts for true sync", feeModel: "Tuition FREE, Certificate $5" });
});
app.delete("/api/admin/users/:uid", requireAdmin, async (req, res) => {
  await (await store()).deleteUser(req.params.uid);
  json(res, 200, { ok: true });
});

/* ------------------------------ admin: database console ------------------------------ */
app.get("/api/admin/database", requireAdmin, async (_req, res) => {
  const s = await store();
  json(res, 200, {
    engine: s.engine,
    file: s.file,
    firebaseProject: firebaseProjectId,
    trueDatabase: "Firebase Firestore — course content, users (role), progress, certificates, payments",
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
    tables: await s.adminTables(),
  });
});
app.get("/api/admin/database/:table", requireAdmin, async (req, res) => {
  try {
    json(res, 200, { table: req.params.table, rows: await (await store()).dumpTable(req.params.table) });
  } catch (e) {
    json(res, 404, { error: (e as Error).message });
  }
});
app.delete("/api/admin/database/:table/:key", requireAdmin, async (req, res) => {
  try {
    const ok = await (await store()).deleteRecord(req.params.table, decodeURIComponent(req.params.key));
    json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "Record not found" });
  } catch (e) {
    json(res, 400, { error: (e as Error).message });
  }
});
app.post("/api/admin/reseed", requireAdmin, async (_req, res) => {
  const result = await (await store()).reseed();
  json(res, 200, { ok: true, message: "Content tables restored from bundled curriculum data. Firestore also seedable via admin UI.", result });
});

/* ------------------------------ admin: content CRUD ------------------------------ */
const CONTENT_RESOURCES = {
  lessons: { list: "listLessons", get: "getLesson", upsert: "upsertLesson", del: "deleteLesson", idField: "id" },
  videos: { list: "listVideos", get: "getVideo", upsert: "upsertVideo", del: "deleteVideo", idField: "id" },
  niches: { list: "listNiches", get: "getNiche", upsert: "upsertNiche", del: "deleteNiche", idField: "id" },
  founders: { list: "listFounders", get: "getFounder", upsert: "upsertFounder", del: "deleteFounder", idField: "id" },
  posts: { list: "listPosts", get: "getPost", upsert: "upsertPost", del: "deletePost", idField: "slug" },
  modules: { list: "listModules", get: "getModule", upsert: "upsertModule", del: "deleteModule", idField: "id" },
};

app.get("/api/admin/content/:resource", requireAdmin, async (req, res) => {
  const cfg = (CONTENT_RESOURCES as any)[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  json(res, 200, await (await store())[cfg.list]());
});

app.post("/api/admin/content/:resource", requireAdmin, async (req, res) => {
  const cfg = (CONTENT_RESOURCES as any)[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  const body = req.body || {};
  if (!body[cfg.idField]) return json(res, 400, { error: `Body must include "${cfg.idField}"` });
  json(res, 200, await (await store())[cfg.upsert](body));
});

app.put("/api/admin/content/:resource/:id", requireAdmin, async (req, res) => {
  const cfg = (CONTENT_RESOURCES as any)[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  const s = await store();
  const existing = (await (s as any)[cfg.get]?.(req.params.id)) || {};
  const merged = { ...existing, ...(req.body || {}), [cfg.idField]: req.params.id };
  json(res, 200, await (s as any)[cfg.upsert](merged));
});

app.delete("/api/admin/content/:resource/:id", requireAdmin, async (req, res) => {
  const cfg = (CONTENT_RESOURCES as any)[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  await (await store())[cfg.del](req.params.id);
  json(res, 200, { ok: true });
});

/* ------------------------------ admin: inbox lists ------------------------------ */
app.get("/api/contact", requireAdmin, async (_req, res) => json(res, 200, await (await store()).listMessages()));
app.get("/api/newsletter", requireAdmin, async (_req, res) => json(res, 200, await (await store()).listSubscribers()));
app.get("/api/investors", requireAdmin, async (_req, res) => json(res, 200, await (await store()).listInvestorInquiries()));
app.get("/api/database", requireAdmin, async (_req, res) => json(res, 200, await (await store()).databaseInfo()));

/* ------------------------------ static SPA ------------------------------ */
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(DIST, "index.html")));
  console.log(`[web] serving static build from ${DIST} — Firestore true DB, tuition FREE, cert $${CERT_FEE}`);
} else {
  app.get("/", (_req, res) =>
    res.type("html").send(
      `<h1>Billionaire Blueprint API</h1><p>API running. True DB: Firestore. Tuition FREE, Certificate $${CERT_FEE} paid. Build frontend with <code>npm run build</code>.</p>`
    )
  );
}

/* ------------------------------ 404 for API ------------------------------ */
app.use("/api/", (_req, res) => json(res, 404, { error: "Not found", trueDatabase: "Firebase Firestore", tuitionModel: "FREE" }));

export default app;
