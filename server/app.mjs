/**
 * Billionaire Blueprint — Express app (storage-agnostic).
 * Used by:
 *   - server/index.mjs  (local: listens on a port, serves dist + API)
 *   - api/index.mjs     (Vercel serverless function)
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getStore } from "./storage.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

const app = express();
app.use(express.json());

const json = (res, code, body) => res.status(code).json(body);
const store = () => getStore();

const clip = (v, n) => String(v ?? "").slice(0, n);

/* ------------------------------ health ------------------------------ */
app.get("/api/health", async (_req, res) => {
  const s = await store();
  json(res, 200, {
    status: "ok",
    service: "billionaire-blueprint-api",
    db: s.engine,
    tables: (await s.databaseInfo()).tables,
    time: new Date().toISOString(),
  });
});

/* ------------------------------ stats ------------------------------ */
app.get("/api/stats", async (_req, res) => {
  json(res, 200, await (await store()).stats());
});

/* --------------------------- database info --------------------------- */
app.get("/api/database", async (_req, res) => {
  json(res, 200, await (await store()).databaseInfo());
});

/* ------------------------------ founders ------------------------------ */
app.get("/api/founders", async (_req, res) => json(res, 200, await (await store()).listFounders()));
app.get("/api/founders/:id", async (req, res) => {
  const f = await (await store()).getFounder(req.params.id);
  if (!f) return json(res, 404, { error: "Founder not found" });
  json(res, 200, f);
});

/* ------------------------------ modules ------------------------------ */
app.get("/api/modules", async (_req, res) => json(res, 200, await (await store()).listModules()));

/* ------------------------------ lessons ------------------------------ */
app.get("/api/lessons", async (_req, res) => json(res, 200, await (await store()).listLessons()));
app.get("/api/lessons/:id", async (req, res) => {
  const l = await (await store()).getLesson(req.params.id);
  if (!l) return json(res, 404, { error: "Lesson not found" });
  json(res, 200, l);
});

/* ------------------------------ videos ------------------------------ */
app.get("/api/videos", async (_req, res) => json(res, 200, await (await store()).listVideos()));

/* ------------------------------ niches ------------------------------ */
app.get("/api/niches", async (_req, res) => json(res, 200, await (await store()).listNiches()));
app.get("/api/niches/:id", async (req, res) => {
  const n = await (await store()).getNiche(req.params.id);
  if (!n) return json(res, 404, { error: "Niche not found" });
  json(res, 200, n);
});

/* ------------------------------- posts ------------------------------- */
app.get("/api/posts", async (_req, res) => json(res, 200, await (await store()).listPosts()));
app.get("/api/posts/:slug", async (req, res) => {
  const p = await (await store()).getPost(req.params.slug);
  if (!p) return json(res, 404, { error: "Post not found" });
  json(res, 200, p);
});

/* ------------------------------ search ------------------------------ */
app.get("/api/search", async (req, res) => {
  const q = clip(req.query.q, 100);
  if (!q) return json(res, 400, { error: "q query param is required" });
  json(res, 200, await (await store()).search(q));
});

/* ---------------------------- contact form ---------------------------- */
app.post("/api/contact", async (req, res) => {
  const { name, email, subject = "General", message } = req.body || {};
  if (!name || !email || !message) return json(res, 400, { error: "name, email and message are required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: "email is not valid" });
  const created = await (await store()).addMessage({ name: clip(name, 120), email: clip(email, 200), subject: clip(subject, 200), message: clip(message, 5000) });
  json(res, 201, created);
});
app.get("/api/contact", async (_req, res) => json(res, 200, await (await store()).listMessages()));

/* ------------------------------ comments ------------------------------ */
app.post("/api/comments", async (req, res) => {
  const { lessonId, clientId, name, text } = req.body || {};
  if (!lessonId || !clientId || !name || !text) return json(res, 400, { error: "lessonId, clientId, name and text are required" });
  const lesson = await (await store()).getLesson(lessonId);
  if (!lesson) return json(res, 404, { error: "Lesson not found" });
  json(res, 201, await (await store()).addComment({ lessonId, clientId: clip(clientId, 200), name, text }));
});
app.get("/api/comments", async (req, res) => {
  const lessonId = clip(req.query.lessonId, 200);
  if (!lessonId) return json(res, 400, { error: "lessonId query param is required" });
  json(res, 200, await (await store()).listComments(lessonId));
});

/* ---------------------------- leaderboard ---------------------------- */
app.get("/api/leaderboard", async (_req, res) => json(res, 200, await (await store()).leaderboard()));

/* ----------------------------- newsletter ----------------------------- */
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return json(res, 400, { error: "email is required" });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: "email is not valid" });
  json(res, 201, await (await store()).addSubscriber(email));
});
app.get("/api/newsletter", async (_req, res) => json(res, 200, await (await store()).listSubscribers()));

/* ---------------------------- lesson progress ---------------------------- */
app.post("/api/progress", async (req, res) => {
  const { clientId, lessonId } = req.body || {};
  if (!clientId || !lessonId) return json(res, 400, { error: "clientId and lessonId are required" });
  const ok = await (await store()).setProgress(clip(clientId, 200), clip(lessonId, 200));
  if (!ok) return json(res, 404, { error: "Lesson not found" });
  json(res, 200, { ok: true, lessonId, completed: true });
});
app.get("/api/progress", async (req, res) => {
  const clientId = clip(req.query.clientId, 200);
  if (!clientId) return json(res, 400, { error: "clientId query param is required" });
  json(res, 200, { clientId, lessonIds: await (await store()).getProgress(clientId) });
});
app.delete("/api/progress", async (req, res) => {
  const { clientId, lessonId } = req.body || {};
  if (!clientId || !lessonId) return json(res, 400, { error: "clientId and lessonId are required" });
  await (await store()).clearProgress(clip(clientId, 200), clip(lessonId, 200));
  json(res, 200, { ok: true, lessonId, completed: false });
});

/* ----------------------------- admin auth & overview ----------------------------- */
app.post("/api/admin/login", async (req, res) => {
  const { email = "", password = "" } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();
  const validEmails = ["seed@admin", "seed@admin.com", "seedwell@seedwel.com", "zacheus@seedwelinvestment.com"];
  if (!validEmails.includes(cleanEmail) || String(password).trim() !== "122023") {
    return json(res, 401, { error: "Invalid email or password. Use seed@admin and password 122023." });
  }
  const isZacheus = cleanEmail.includes("zacheus");
  json(res, 200, {
    success: true,
    token: `seed-admin-token-${Date.now()}`,
    admin: {
      name: isZacheus ? "Zacheus Simbaya" : "Mr. Seedwell Khayalethu Masuku",
      role: isZacheus ? "Country Director — Zambia" : "Founder & CEO, Seedwel Investment Limited",
      email: cleanEmail,
    },
  });
});

app.get("/api/admin/overview", async (_req, res) => {
  const s = await store();
  const [stats, dbInfo, messages, subscribers, inquiries] = await Promise.all([
    s.stats(),
    s.databaseInfo(),
    s.listMessages(),
    s.listSubscribers(),
    s.listInvestorInquiries(),
  ]);
  json(res, 200, {
    company: {
      name: "Seedwel Investment Limited",
      registeredYear: 2025,
      status: "Active & Open for Investor Partnerships",
      founder: "Mr. Seedwell Khayalethu Masuku",
      countryDirectorZambia: "Zacheus Simbaya",
      adminEmail: "seed@admin",
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
  });
});

app.get("/api/admin/recommendations", async (_req, res) => {
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
        description: "Connect a hosted database via DATABASE_URL so that investor inquiries, student progress, and admin logs persist across cloud deployments.",
        impact: "Guarantees zero data loss for production investor deal flow.",
        status: "Recommended",
      },
    ],
  });
});

/* ----------------------------- investor inquiries ----------------------------- */
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
app.get("/api/investors", async (_req, res) => {
  json(res, 200, await (await store()).listInvestorInquiries());
});

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
