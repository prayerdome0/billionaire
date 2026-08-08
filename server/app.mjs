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
import { createRequire } from "node:module";
import express from "express";
import { getStore } from "./storage.mjs";
import { engagement } from "./engagement.mjs";
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

const require = createRequire(import.meta.url);
/** Single source of truth for bundled content (same file the storage layer seeds from). */
const seed = require("../src/data/content.json");

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(optionalUser);

const json = (res, code, body) => res.status(code).json(body);
const errMsg = (e) => (e instanceof Error ? e.message : String(e ?? "unknown error"));
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
    successStories: (seed.successStories || []).length,
    totalVideoViews: engagement.totalViews(),
    feedbackCount: engagement.stats().feedbackCount,
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

/* ------------------------------ success stories (successful people + their videos) ------------------------------ */

app.get("/api/success-stories", async (_req, res) => {
  const stories = seed.successStories || [];
  json(
    res,
    200,
    stories.map((s) => ({ ...s, views: engagement.getVideoViews(`story-${s.id}`) }))
  );
});

app.get("/api/success-stories/:id", async (req, res) => {
  const story = (seed.successStories || []).find((s) => s.id === req.params.id);
  if (!story) return json(res, 404, { error: "Success story not found" });
  json(res, 200, { ...story, views: engagement.getVideoViews(`story-${story.id}`) });
});

/* ------------------------------ video library — singles, stats, views, related ------------------------------ */

app.get("/api/videos/stats", async (_req, res) => {
  const s = await store();
  const videos = await s.listVideos();
  const stories = seed.successStories || [];
  const withViews = [
    ...videos.map((v) => ({ id: v.id, title: v.title, youtubeId: v.youtubeId, views: engagement.getVideoViews(v.id) })),
    ...stories.map((st) => ({ id: `story-${st.id}`, title: st.video?.title || st.name, youtubeId: st.video?.youtubeId || "", person: st.name, views: engagement.getVideoViews(`story-${st.id}`) })),
  ].sort((a, b) => b.views - a.views);
  json(res, 200, { totalViews: engagement.totalViews(), topVideos: withViews.slice(0, 10), all: withViews });
});

app.post("/api/videos/:id/view", async (req, res) => {
  const id = clip(req.params.id, 200);
  const views = engagement.addVideoView(id);
  json(res, 200, { ok: true, id, views, message: "Thank you for watching! View counted." });
});

app.get("/api/videos/:id", async (req, res) => {
  const s = await store();
  const id = req.params.id;
  if (id.startsWith("story-")) {
    const story = (seed.successStories || []).find((x) => x.id === id.slice(6));
    if (!story || !story.video) return json(res, 404, { error: "Story video not found" });
    return json(res, 200, {
      id,
      person: story.name,
      title: story.video.title,
      channel: story.video.channel,
      description: `${story.name} — ${story.title}. ${story.encouragement}`,
      youtubeId: story.video.youtubeId,
      moduleId: "success-stories",
      duration: story.video.duration,
      level: "Inspiration",
      tags: story.tags,
      kind: "success-story",
      views: engagement.getVideoViews(id),
      introAudio: story.video.introAudio || null,
      outroAudio: story.video.outroAudio || null,
    });
  }
  const video = (await s.listVideos()).find((v) => v.id === id);
  if (!video) return json(res, 404, { error: "Video not found" });
  json(res, 200, { ...video, views: engagement.getVideoViews(id) });
});

app.get("/api/videos/:id/related", async (req, res) => {
  const s = await store();
  const id = req.params.id;
  const isStory = id.startsWith("story-");
  const current = isStory ? (seed.successStories || []).find((x) => x.id === id.slice(6)) : (await s.listVideos()).find((v) => v.id === id);
  if (!current) return json(res, 404, { error: "Video not found" });
  if (isStory) {
    const rest = (seed.successStories || []).filter((x) => x.id !== id.slice(6) && x.video);
    json(
      res,
      200,
      rest.slice(0, 6).map((x) => ({ id: `story-${x.id}`, person: x.name, title: x.video.title, youtubeId: x.video.youtubeId, moduleId: "success-stories", duration: x.video.duration, level: "Inspiration", tags: x.tags, kind: "success-story" }))
    );
    return;
  }
  const rest = (await s.listVideos()).filter((v) => v.id !== id && (v.moduleId === current.moduleId || v.tags?.some((t) => current.tags?.includes(t))));
  json(res, 200, (rest.length ? rest : (await s.listVideos()).filter((v) => v.id !== id)).slice(0, 6));
});

/* ------------------------------ quote of the day + site config ------------------------------ */

app.get("/api/quote", async (req, res) => {
  const stories = seed.successStories || [];
  if (!stories.length) return json(res, 404, { error: "No quotes available yet" });
  const day = String(new Date().toISOString().slice(0, 10));
  const pick = stories[day.split("-").reduce((a, c) => (Math.imul(31, a) + Number(c)) | 0, 7) % stories.length];
  const random = stories[Math.floor(Math.random() * stories.length)];
  json(res, 200, {
    date: day,
    quote: pick.quote,
    author: pick.name,
    country: pick.country,
    title: pick.title,
    photo: pick.photo,
    encouragement: pick.encouragement,
    video: pick.video ? { id: `story-${pick.id}`, ...pick.video } : null,
    random: { quote: random.quote, author: random.name, video: random.video ? { id: `story-${random.id}`, ...random.video } : null },
  });
});

app.get("/api/site", (_req, res) =>
  json(res, 200, {
    ...seed.site,
    siteStats: seed.siteStats,
    heroImage: seed.heroImage,
    videoCount: (seed.videos || []).length,
    successStoryCount: (seed.successStories || []).length,
    lessonCount: (seed.lessons || []).length,
    moduleCount: (seed.modules || []).length,
    founderCount: (seed.founders || []).length,
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
    incorporationNote: INCORPORATION_NOTE,
  })
);

/* ------------------------------ feedback (public write, admin read) ------------------------------ */

app.post("/api/feedback", async (req, res) => {
  const { name, email, page, rating, comment, message } = req.body || {};
  const text = comment || message || "";
  if (!text && !rating) return json(res, 400, { error: "rating or comment is required" });
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res, 400, { error: "email is not valid" });
  const created = engagement.addFeedback({ name, email, page, rating, comment: text });
  json(res, 201, { success: true, feedback: created, message: "Thank you for your feedback!" });
});

app.get("/api/feedback", requireAdmin, async (_req, res) => json(res, 200, engagement.listFeedback()));

/* ------------------------------ watch history (signed-in students) ------------------------------ */

app.get("/api/watch-history", requireUser, async (req, res) =>
  json(res, 200, { uid: req.user.uid, history: engagement.getWatchHistory(req.user.uid) })
);

app.post("/api/watch-history", requireUser, async (req, res) => {
  const { videoId, videoTitle } = req.body || {};
  if (!videoId) return json(res, 400, { error: "videoId is required" });
  const history = engagement.addWatch(req.user.uid, videoId, videoTitle);
  json(res, 201, { ok: true, history });
});

/* ------------------------------ API feature index (self-documenting) ------------------------------ */

app.get("/api/features", async (_req, res) => {
  const s = await store();
  const stats = await s.stats();
  const e = engagement.stats();
  json(res, 200, {
    service: "Seedwel Investment Limited — Billionaire Blueprint REST API",
    version: "2.0.0",
    trueDatabase: "Firebase Firestore",
    tuitionModel: "FREE",
    certificateFeeUsd: CERT_FEE,
    content: { lessons: stats.lessons, videos: stats.videos, successStories: (seed.successStories || []).length, modules: stats.modules, niches: stats.niches, founders: stats.founders, posts: stats.posts },
    engagement: e,
    endpoints: [
      { method: "GET", path: "/api/health" },
      { method: "GET", path: "/api/stats" },
      { method: "GET", path: "/api/site" },
      { method: "GET", path: "/api/success-stories" },
      { method: "GET", path: "/api/success-stories/:id" },
      { method: "GET", path: "/api/videos" },
      { method: "GET", path: "/api/videos/stats" },
      { method: "GET", path: "/api/videos/:id" },
      { method: "GET", path: "/api/videos/:id/related" },
      { method: "POST", path: "/api/videos/:id/view" },
      { method: "GET", path: "/api/quote" },
      { method: "POST", path: "/api/feedback" },
      { method: "GET", path: "/api/feedback" },
      { method: "GET", path: "/api/watch-history" },
      { method: "POST", path: "/api/watch-history" },
      { method: "GET", path: "/api/founders" },
      { method: "GET", path: "/api/modules" },
      { method: "GET", path: "/api/lessons" },
      { method: "GET", path: "/api/lessons/:id" },
      { method: "GET", path: "/api/niches" },
      { method: "GET", path: "/api/posts" },
      { method: "GET", path: "/api/search?q=" },
      { method: "POST", path: "/api/contact" },
      { method: "POST", path: "/api/newsletter" },
      { method: "POST", path: "/api/investors" },
      { method: "GET", path: "/api/leaderboard" },
      { method: "GET", path: "/api/comments?lessonId=" },
      { method: "POST", path: "/api/comments" },
      { method: "GET", path: "/api/progress" },
      { method: "POST", path: "/api/progress" },
      { method: "GET", path: "/api/certificates/me" },
      { method: "POST", path: "/api/certificates/claim" },
      { method: "POST", path: "/api/certificates/pay" },
      { method: "GET", path: "/api/features" },
    ],
  });
});

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
  const results = await (await store()).search(q);
  const needle = q.toLowerCase();
  const hit = (s) => String(s || "").toLowerCase().includes(needle);
  results.successStories = (seed.successStories || [])
    .filter((s) => hit(s.name) || hit(s.title) || hit(s.quote) || hit(s.country) || s.tags?.some(hit) || hit(s.video?.title))
    .map((s) => ({ id: s.id, name: s.name, title: s.title, photo: s.photo, quote: s.quote, video: s.video ? { id: `story-${s.id}`, ...s.video } : null }));
  json(res, 200, results);
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

/* ------------------------------ certificates — $5 quotation, tuition FREE, admin delivery ------------------------------ */
app.get("/api/certificates/me", requireUser, async (req, res) => {
  try {
    const s = await store();
    const cert = (await (s.getCertificateByUid?.(req.user.uid) || s.getCertificate?.(req.user.uid))) || null;
    if (!cert) return json(res, 200, { paid: false, exists: false, feeUsd: CERT_FEE, tuitionModel: "FREE", incorporationNote: INCORPORATION_NOTE });
    json(res, 200, cert);
  } catch (e) {
    json(res, 200, { paid: false, exists: false, feeUsd: CERT_FEE, tuitionModel: "FREE", error: errMsg(e) });
  }
});

app.post("/api/certificates/claim", requireUser, async (req, res) => {
  const { nameOnCertificate, completed, total } = req.body || {};
  if (!nameOnCertificate) return json(res, 400, { error: "nameOnCertificate required" });
  const s = await store();
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const certNum = `SWL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.abs(nameOnCertificate.split("").reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0)) % 100000}-${Math.floor(Math.random() * 9000) + 1000}`;
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
    json(res, 500, { error: errMsg(e) });
  }
});

app.post("/api/certificates/pay", requireUser, async (req, res) => {
  // Legacy API route retained for integrations. It now creates a quotation for
  // manual admin verification; it never simulates a charge or marks a
  // certificate paid/issued by itself.
  const { paymentMethod = "card" } = req.body || {};
  const s = await store();
  try {
    const existing = await (s.getCertificateByUid?.(req.user.uid) || s.getCertificate?.(req.user.uid));
    if (!existing) {
      return json(res, 409, { error: "Create a certificate claim before sending a payment quotation." });
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const quotationNumber = `QTE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
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
      quotationNumber,
      requestType: "certificate_quotation",
      deliveryWindowHours: 48,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    await s.addCertificatePayment?.(payment);

    json(res, 202, {
      success: true,
      status: "pending_admin",
      feeUsd: CERT_FEE,
      tuitionModel: "FREE",
      paymentId,
      quotationNumber,
      deliveryWindowHours: 48,
      certificate: existing,
      message: `Payment quotation sent to admin. After payment is verified, the certificate will be sent within 48 hours.`,
    });
  } catch (e) {
    json(res, 500, { error: errMsg(e) });
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
  return json(res, 403, {
    error: "Password login is disabled. Sign in with your Firebase admin account (role field in Firestore users/{uid}).",
    code: "USE_FIREBASE",
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
    engagement: engagement.stats(),
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
    stats: { ...stats, certificateClaims: (certificates || []).length, certificatePayments: (payments || []).length },
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
        title: "Optional: integrate payment providers for the $5 certificate quotation",
        priority: "Medium",
        actionType: "Upgrade",
        description: "The active workflow sends a payment quotation to the admin, who verifies payment and sends the certificate within 48 hours. If automated collection is needed later, add Stripe Checkout, PayPal SDK, or Mobile Money while keeping the admin delivery queue as the issuance control.",
        impact: "Adds payment convenience without bypassing manual certificate delivery.",
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
    json(res, 404, { error: errMsg(e) });
  }
});
app.delete("/api/admin/database/:table/:key", requireAdmin, async (req, res) => {
  try {
    const ok = await (await store()).deleteRecord(req.params.table, decodeURIComponent(req.params.key));
    json(res, ok ? 200 : 404, ok ? { ok: true } : { error: "Record not found" });
  } catch (e) {
    json(res, 400, { error: errMsg(e) });
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

/* ===================================================================== */
/* ===================== FREE AI API — No Key, No Limit ============= */
/* ===================================================================== */

const investmentTipsFree = [
  "School buildings are forever assets. Land doesn't depreciate, tuition compounds. Zambia enrollment growing 6% yearly — demand > supply.",
  "AI business ROI: $5k into dev training → one developer builds SaaS that earns $2k MRR = 480% annual. Seedwel incubator math.",
  "House hacking in Lusaka: live in 1 unit of 3-plex, rent 2 others at K3,500 each. Mortgage K5,200 → you live free + K1,800 positive.",
  "Never invest cash you need next 12 months. Emergency fund = 6 months. Then invest. Tilt insurance first.",
  "Diversify: 40% school real estate, 30% AI SaaS, 20% index, 10% moonshots.",
  "Cost of delay: $500/month at 16% school yield = $1.3M in 20 years.",
  "Solar school = two businesses: education + energy. Diesel K80k/year → solar cuts 70%.",
  "Buffett test: Would you own school campus if market closed 10 years? Students need school regardless — that's moat."
];

const businessIdeasMap = {
  school: [
    "Mobile lab visiting rural schools — $200/school/term, 40 schools = $8k MRR",
    "AI homework tutor Zambian curriculum — $5/month per student, 2000 students = $10k MRR",
    "Uniform marketplace — 15% take rate",
    "School transport tracker — $2/child/month"
  ],
  ai: [
    "WhatsApp AI answers parent queries — $99/month per school",
    "Crop disease detector from photo — $5/diagnosis for 10k farmers",
    "Mining safety checklist AI — $5k/month to Zambian mines",
    "Grade prediction AI — $300/month per school"
  ],
  agriculture: [
    "Cold chain tomato logistics — 30% margin",
    "Solar irrigation-as-a-service — $30/month vs $150 diesel",
    "Avocado aggregator exporting to SA",
    "Village chicken feed subscription via mobile money"
  ],
  general: [
    "Load shedding bakery: bake night cheap ZESCO, sell morning fresh",
    "Mobile money float service — 2% margin",
    "CV writer K150 per CV, 20/week = K12k/month",
    "AI voiceover for radio ads — K500 per ad"
  ]
};

function freeAIReply(qRaw) {
  const q = String(qRaw || "").toLowerCase();
  if (q.includes("no capital") || q.includes("no money") || q.includes("broke")) {
    return `Zero-Capital Start TODAY: 1) Skill flip 24h — Canva, CV writing, WhatsApp setup K200 on FB groups. 2) Interview 10 school owners — #1 headache is parents late pay → build WhatsApp reminder K300/month per school. 3) Seedwel FREE tuition 28 lessons, $5 cert only after. First $100 service, $1k productized, $10k system. What skill you sell by 6pm tomorrow?`;
  }
  if (q.includes("school") || q.includes("zambia") || q.includes("invest")) {
    return `${investmentTipsFree[Math.floor(Math.random()*investmentTipsFree.length)]} Open deals: STEM Phase1 $10k min 14-18% yield + land equity, AI Fund $5k min 25% IRR, Real Estate $25k min 16% yield triple-net. Asymmetric move: if $500-$5k, build tool for one school problem, bring traction to Seedwel, we fund operators.`;
  }
  if (q.includes("ai") || q.includes("tech") || q.includes("software")) {
    const ideas = businessIdeasMap.ai;
    const pick = ideas[Math.floor(Math.random()*ideas.length)];
    return `AI is permissionless leverage. No permission needed. 3 plays no code: 1) Vertical wrapper — hated manual task automation, sell at 20% human cost. Eg: ${pick}. 2) Education arbitrage — past papers → AI tutor K200/month. 3) Manager play — learn prompting 15 days, train 5 youths, you become manager. Free tools: ChatGPT, Claude, HuggingFace, Colab. What manual task you delete forever?`;
  }
  if (q.includes("365") || q.includes("challenge") || q.includes("journey")) {
    return `365 Journey Movie: Act1 Starter Day1-30 identity, cash truth, first $100. Act2 Builder Day31-90 validation 10 sales. Act3 Warrior Day91-180 scale automate hire. Act4 Billionaire Day181-365 3 engines legacy. Each day 15-90 mins, points, streak, video of successful person, AI coach free. Today is Day ${Math.floor(Math.random()*365)+1}. MIT before 10am.`;
  }
  return `Free AI Mentor — Zambian context: 1) Cash flow direction asset vs liability? 2) Load shedding, mobile money, small farmers = problems not in Silicon Valley = less competition. 3) Validate 30 days landing page + 10 concierge deliveries. Seedwel tuition FREE, videos free, success free. $5 cert only. Moves before midnight: 10-year vision paragraph, 5 loud complaints list, DM 1 person $20 fix.`;
}

app.get("/api/ai/tip", async (_req, res) => {
  json(res, 200, { tip: investmentTipsFree[Math.floor(Math.random()*investmentTipsFree.length)], category: "Investment", source: "Seedwel Free AI", noKey: true, free: true, time: new Date().toISOString() });
});

app.get("/api/ai/ideas", async (req, res) => {
  const industry = clip(req.query.industry || "general", 50).toLowerCase();
  const list = businessIdeasMap[industry] || businessIdeasMap.general;
  json(res, 200, { industry, ideas: list, count: list.length, pricing: "Ideas free, validation in 30 days with landing page + concierge", freeAI: true });
});

app.get("/api/ai/mentor", async (req, res) => {
  const q = clip(req.query.question || req.query.q || "", 500);
  const persona = clip(req.query.persona || "zacheus", 30);
  if (!q) return json(res, 400, { error: "question query param required, e.g. /api/ai/mentor?question=how to start with $0" });
  const personas = {
    dangote: "Aliko Dangote lens: manufacturing, reinvest 100% 15 years, build what Africa imports.",
    buffett: "Warren Buffett lens: 20-slot punch card, moats, never lose money, compounding.",
    oprah: "Oprah lens: empathy, own distribution, trust = compounding asset.",
    strive: "Strive lens: resilience, 5-year no as law school, infrastructure stacks.",
    zacheus: "Zacheus Simbaya lens: Zambia schools, AI dev ecosystem, milestone escrow."
  };
  const reply = freeAIReply(q);
  json(res, 200, {
    free: true, noKey: true, persona, personaStyle: personas[persona] || personas.zacheus,
    question: q, reply: `${personas[persona] || personas.zacheus}\n\n${reply}`,
    suggestions: ["Give me 30-day plan to first $1000", "What should I invest with $500 in Zambia?", "Roast my excuse: I have no capital", "Write LinkedIn post about school investing"],
    api: "Free AI — Seedwel local intelligence, no external API key",
    time: new Date().toISOString()
  });
});

app.post("/api/ai/chat", async (req, res) => {
  const { message, history = [], persona = "zacheus" } = req.body || {};
  if (!message) return json(res, 400, { error: "message required" });
  const reply = freeAIReply(message);
  json(res, 200, {
    free: true, noKey: true, persona,
    you: message,
    reply,
    historyLength: Array.isArray(history) ? history.length : 0,
    suggestions: ["Give me business idea with $0", "Test my investment idea", "Assign 365 challenge today"],
    time: new Date().toISOString()
  });
});

app.post("/api/ai/wealth-plan", async (req, res) => {
  const { income = 800, goal = 10000, risk = "medium", months = 12 } = req.body || {};
  const inc = Number(income) || 800;
  const g = Number(goal) || 10000;
  const m = Number(months) || 12;
  const monthlySave = Math.round((g / m) * 0.6);
  const bizTarget = Math.round(g * 0.4);
  json(res, 200, {
    free: true, noKey: true,
    input: { income: inc, goal: g, risk, months: m },
    plan: {
      split: "70/20/10 — 70% day job, 20% side business, 10% investing automated",
      monthly: {
        saveForInvest: monthlySave,
        sideBusinessTarget: `Sell ${Math.ceil(bizTarget/100)} offers at $100 or ${Math.ceil(bizTarget/300)} at $300`,
        invest: `${Math.round(inc*0.1)}/month into index + school fund`
      },
      phases: [
        `Months 1-3: Emergency 6 months, fix budget, pick massive problem, interview 50 people`,
        `Months 4-6: Launch MVP, first 10 customers, reinvest 100%`,
        `Months 7-9: Productize, raise 20%, hire/automate bottleneck`,
        `Months 10-12: Second income engine, review portfolio, plan next asymmetric bet`
      ],
      dailyMIT: "90 mins deep work before 10am on income engine",
      metrics: "Track cash flow monthly, not vanity",
      tuition: "FREE — 28 lessons free, cert $5 only",
      tip: investmentTipsFree[Math.floor(Math.random()*investmentTipsFree.length)]
    },
    time: new Date().toISOString()
  });
});

app.get("/api/ai/daily-challenge", async (req, res) => {
  const day = Math.max(1, Math.min(365, Number(req.query.day) || 1));
  // simple deterministic challenge pick
  const cats = ["Mindset","Money","Business","Investment","AI","Skills","Network","Health"];
  const diffs = ["Starter","Builder","Warrior","Billionaire"];
  const cat = cats[(day-1)%cats.length];
  const diff = day<=30?"Starter":day<=90?"Builder":day<=180?"Warrior":"Billionaire";
  json(res, 200, {
    free: true, noKey: true, day, category: cat, difficulty: diff,
    title: `Day ${day}: ${cat} — ${diff} Level`,
    description: `Real movie-like daily mission for ${cat}. 15-90 mins, points, reflection, related successful person video. Day ${day} of 365 Journey to Success.`,
    actions: ["Pick MIT and finish before 10am", "Do 1 real action that could earn or learn", "Write reflection, log in local progress"],
    points: diff==="Starter"?10:diff==="Builder"?25:diff==="Warrior"?50:100,
    timeMinutes: diff==="Starter"?15:diff==="Builder"?30:diff==="Warrior"?60:90,
    quote: investmentTipsFree[day % investmentTipsFree.length],
    api: "/api/challenge/365 full list"
  });
});

app.get("/api/challenge/365", async (req, res) => {
  const from = Math.max(1, Math.min(365, Number(req.query.from) || 1));
  const to = Math.max(from, Math.min(365, Number(req.query.to) || 50));
  const challenges = [];
  const cats = ["Mindset","Money","Business","Investment","AI","Skills","Network","Health"];
  for (let d=from; d<=to; d++) {
    const cat = cats[(d-1)%cats.length];
    const diff = d<=30?"Starter":d<=90?"Builder":d<=180?"Warrior":"Billionaire";
    challenges.push({
      day: d, title: `Day ${d}: ${cat} Challenge — ${diff}`, category: cat, difficulty: diff,
      description: `Day ${d} mission — ${cat} focused, ${diff} level, ${diff==="Starter"?15:diff==="Builder"?30:60} mins, movie animation ready.`,
      actions: ["MIT before 10am", "Real action", "Reflection log"],
      points: diff==="Starter"?10:diff==="Builder"?25:diff==="Warrior"?50:100,
      timeMinutes: diff==="Starter"?15:diff==="Builder"?30:diff==="Warrior"?60:90,
      reward: `Day ${d} Badge`,
      week: Math.floor((d-1)/7)+1
    });
  }
  json(res, 200, { free: true, noKey: true, total: 365, from, to, count: challenges.length, challenges, fullListEndpoint: "/api/challenge/365?from=1&to=365", aiEndpoint: "/api/ai/daily-challenge?day=1" });
});

app.get("/api/investment-photos", async (_req, res) => {
  const photos = [
    { id:"school-1", title:"Modern STEM Classroom", category:"School Building", location:"Lusaka", image:"https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1200", description:"STEM classrooms solar+AI fiber", stats:[{label:"Students",value:"800+"}] },
    { id:"ai-1", title:"AI Developer Hub", category:"AI Business", location:"Pan-African Hub", image:"https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1200", description:"50+ devs, 12 products", stats:[{label:"Devs",value:"50+"}] },
    { id:"solar-1", title:"Solar Microgrid", category:"Solar Energy", location:"Rural Zambia", image:"https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?auto=compress&cs=tinysrgb&w=1200", description:"150kW solar", stats:[{label:"Capacity",value:"150kW"}] }
  ];
  json(res, 200, { free:true, count: photos.length, photos, note:"Full 12 photos in frontend data/investmentVisuals.ts with Pexels CDN, Ken Burns animation" });
});

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
