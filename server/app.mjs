/**
 * Billionaire Blueprint — Express app (storage-agnostic, Firebase-verified).
 * Used by:
 *   - server/index.mjs  (local: listens on a port, serves dist + API)
 *   - api/index.mjs     (Vercel serverless function)
 *
 * Access model:
 *   PUBLIC   — content reads (lessons outline, videos, founders, posts, search,
 *              leaderboard), plus contact / newsletter / investor writes.
 *   STUDENT  — everything a signed-in Firebase user can do: lesson progress,
 *              comments (the actual course requires registration).
 *   ADMIN    — Seedwel management only: user management, full database browser,
 *              content CRUD, inbox, reseed, API explorer. Verified server-side
 *              via Firebase ID tokens + an allowlist / users-table admin role.
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

/* ------------------------------ health ------------------------------ */
app.get("/api/health", async (_req, res) => {
  const s = await store();
  json(res, 200, {
    status: "ok",
    service: "seedwel-billionaire-api",
    db: s.engine,
    firebaseProject: firebaseProjectId,
    tables: Object.keys((await s.databaseInfo()).tables || {}).length,
    time: new Date().toISOString(),
  });
});

/* ------------------------------ stats (public) ------------------------------ */
app.get("/api/stats", async (_req, res) => {
  json(res, 200, await (await store()).stats());
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
    },
    isAdmin: !!u.admin,
    adminEmails: [...adminAllowlist()],
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
  json(res, 200, { ok: true, lessonId, completed: true });
});
app.get("/api/progress", requireUser, async (req, res) => {
  json(res, 200, { uid: req.user.uid, lessonIds: await (await store()).getProgress(req.user.uid) });
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

/** Development-only login for local previews. HARD-DISABLED in production:
 *  real deployments always go through Firebase Authentication. */
app.post("/api/admin/login", async (req, res) => {
  if (!DEV_ADMIN_ENABLED) {
    return json(res, 403, {
      error: "Password login is disabled in production. Sign in with your Firebase admin account.",
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
    },
  });
});

app.get("/api/admin/overview", requireAdmin, async (_req, res) => {
  const s = await store();
  const [stats, dbInfo, messages, subscribers, inquiries, users] = await Promise.all([
    s.stats(),
    s.databaseInfo(),
    s.listMessages(),
    s.listSubscribers(),
    s.listInvestorInquiries(),
    s.listUsers().catch(() => []),
  ]);
  json(res, 200, {
    company: {
      name: "Seedwel Investment Limited",
      registeredYear: 2025,
      status: "Active & Open for Investor Partnerships",
      founder: "Mr. Seedwell Khayalethu Masuku",
      countryDirectorZambia: "Zacheus Simbaya",
      adminEmail: "seedwell@seedwel.com",
      pillars: [
        "School Building & Educational Infrastructure",
        "AI Business & Software Developer Ecosystem",
        "Strategic Real Estate & Wealth Education",
      ],
    },
    stats,
    database: dbInfo,
    messages,
    subscribers,
    investorInquiries: inquiries,
    users,
  });
});

app.get("/api/admin/recommendations", requireAdmin, async (_req, res) => {
  json(res, 200, {
    summary: "System Growth & Strategic Upgrade Roadmap for Seedwel Investment Limited",
    company: "Seedwel Investment Limited — Registered 2025",
    recommendations: [
      {
        id: "rec-school-escrow",
        category: "School Building & Educational Infrastructure",
        title: "Zambia School Construction Escrow & Milestone Tracking",
        priority: "High",
        actionType: "Upgrade",
        description: "Upgrade the investor dashboard to provide real-time architectural milestones, drone inspection videos, and escrow verification for the 15 STEM & AI schools currently planned in Lusaka and the Copperbelt.",
        impact: "Increases investor trust and accelerates ticket sizes from regional family offices.",
        status: "Recommended",
      },
      {
        id: "rec-ai-incubator",
        category: "AI Business & Developer Ecosystem",
        title: "Pan-African Tech Developer Talent Showcase & Incubator Portal",
        priority: "High",
        actionType: "Add",
        description: "Add a dedicated Developer Incubator portal where investors can browse AI software startups, view developer code commits, and co-invest in early-stage African tech teams.",
        impact: "Monetizes the AI developer pipeline and creates high-margin recurring software revenue.",
        status: "Recommended",
      },
      {
        id: "rec-investor-prospectus",
        category: "Investor Deal Flow & Capital Readiness",
        title: "Downloadable Term Sheets & Interactive ROI Simulator",
        priority: "Strategic",
        actionType: "Add",
        description: "Add an interactive return-on-investment (ROI) simulator and automated PDF Term Sheet downloader for institutional investors looking at school building and real estate funds.",
        impact: "Shortens the investor due diligence cycle from weeks to minutes.",
        status: "Recommended",
      },
      {
        id: "rec-kyc-aml",
        category: "Investor Compliance & Security",
        title: "Accredited Investor KYC / AML Verification Workflow",
        priority: "Medium",
        actionType: "Upgrade",
        description: "Upgrade the Investor Inquiry flow with an optional KYC (Know Your Customer) identity verification step for investments exceeding $50,000.",
        impact: "Ensures full compliance with international financial and securities regulations.",
        status: "Recommended",
      },
      {
        id: "rec-zambia-curriculum",
        category: "Curriculum & Educational Platform",
        title: "SADC & African Emerging Market Case Studies in Curriculum",
        priority: "High",
        actionType: "Add",
        description: "Add localized African wealth case studies and live masterclass webinar scheduling with Mr. Seedwell Khayalethu Masuku and Zacheus Simbaya to Module 4 and 5.",
        impact: "Deepens engagement for African entrepreneurs and international investors seeking frontier market insights.",
        status: "Recommended",
      },
      {
        id: "rec-db-persistence",
        category: "Technical & Database Infrastructure",
        title: "Connect Vercel Postgres / Supabase for Production Persistence",
        priority: "High",
        actionType: "Upgrade",
        description: "Connect a hosted database via DATABASE_URL so that investor inquiries, student progress, registered users and admin content edits persist across cloud deployments.",
        impact: "Guarantees zero data loss for production investor deal flow.",
        status: "Recommended",
      },
      {
        id: "rec-firebase-sync",
        category: "Technical & Database Infrastructure",
        title: "Production: enable Firebase Email/Password & create admin accounts",
        priority: "High",
        actionType: "Upgrade",
        description: "In the Firebase console (project seedwel-cbeb8) enable the Email/Password provider and create the accounts seedwell@seedwel.com and zacheus@seedwelinvestment.com — they are on the admin allowlist and instantly unlock this portal.",
        impact: "Turns on registered-only course access and the full admin console in production.",
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
  json(res, 200, await (await store()).setUserRole(req.params.uid, role));
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
    tables: await s.adminTables(),
  });
});
app.get("/api/admin/database/:table", requireAdmin, async (req, res) => {
  try {
    json(res, 200, { table: req.params.table, rows: await (await store()).dumpTable(req.params.table) });
  } catch (e) {
    json(res, 404, { error: e.message });
  }
});
app.delete("/api/admin/database/:table/:key", requireAdmin, async (req, res) => {
  try {
    const ok = await (await store()).deleteRecord(req.params.table, decodeURIComponent(req.params.key));
    json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "Record not found" });
  } catch (e) {
    json(res, 400, { error: e.message });
  }
});
app.post("/api/admin/reseed", requireAdmin, async (_req, res) => {
  const result = await (await store()).reseed();
  json(res, 200, { ok: true, message: "Content tables restored from bundled curriculum data.", result });
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
  const cfg = CONTENT_RESOURCES[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  json(res, 200, await (await store())[cfg.list]());
});

app.post("/api/admin/content/:resource", requireAdmin, async (req, res) => {
  const cfg = CONTENT_RESOURCES[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  const body = req.body || {};
  if (!body[cfg.idField]) return json(res, 400, { error: `Body must include "${cfg.idField}"` });
  json(res, 200, await (await store())[cfg.upsert](body));
});

app.put("/api/admin/content/:resource/:id", requireAdmin, async (req, res) => {
  const cfg = CONTENT_RESOURCES[req.params.resource];
  if (!cfg) return json(res, 404, { error: "Unknown resource" });
  const s = await store();
  const existing = (await s[cfg.get]?.(req.params.id)) || {};
  const merged = { ...existing, ...(req.body || {}), [cfg.idField]: req.params.id };
  json(res, 200, await s[cfg.upsert](merged));
});

app.delete("/api/admin/content/:resource/:id", requireAdmin, async (req, res) => {
  const cfg = CONTENT_RESOURCES[req.params.resource];
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
  // SPA fallback for client-side routes; excludes real API paths (/api/...)
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(join(DIST, "index.html")));
  console.log(`[web] serving static build from ${DIST}`);
} else {
  app.get("/", (_req, res) => res.type("html").send(
    "<h1>Billionaire Blueprint API</h1><p>API is running. Build the frontend with <code>npm run build</code>, or run <code>npm run dev</code> for the Vite dev server.</p>"
  ));
}

/* ------------------------------ 404 for API ------------------------------ */
app.use("/api/", (_req, res) => json(res, 404, { error: "Not found" }));

export default app;
