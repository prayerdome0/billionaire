/**
 * Billionaire Blueprint — API server + static host
 *
 * Built on Node's built-in `node:sqlite` (no native modules) and Express.
 * - Seeds a SQLite database at ./data/billionaire.db from src/data/content.json
 * - Exposes a REST API under /api/*
 * - Serves the built SPA (dist/) in production with client-side routing fallback
 *
 * Run:
 *   npm run server     (API only, for development)
 *   npm start          (production: builds assumed done, serves dist + API)
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DB_DIR = process.env.DB_DIR || join(ROOT, "data");
const DB_PATH = process.env.DB_PATH || join(DB_DIR, "billionaire.db");
const PORT = process.env.PORT || 3001;
const SEED_FILE = join(ROOT, "src", "data", "content.json");

mkdirSync(DB_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);

/* ------------------------------ schema ------------------------------ */
db.exec(`
  CREATE TABLE IF NOT EXISTS founders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    photo TEXT,
    bio TEXT,
    quote TEXT,
    focus TEXT,
    fun_fact TEXT,
    email TEXT,
    socials TEXT
  );
  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    number INTEGER,
    title TEXT,
    tagline TEXT,
    description TEXT,
    icon TEXT,
    gradient TEXT
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    number INTEGER,
    title TEXT,
    subtitle TEXT,
    summary TEXT,
    duration TEXT,
    difficulty TEXT,
    content TEXT,
    takeaways TEXT,
    action_steps TEXT,
    quiz TEXT
  );
  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    module_id TEXT,
    title TEXT,
    channel TEXT,
    description TEXT,
    youtube_id TEXT,
    duration TEXT,
    level TEXT,
    tags TEXT
  );
  CREATE TABLE IF NOT EXISTS niches (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT,
    text TEXT,
    rating INTEGER
  );
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    UNIQUE(client_id, lesson_id)
  );
`);

/* ------------------------------ seeding ------------------------------ */
function seed() {
  const raw = JSON.parse(readFileSync(SEED_FILE, "utf8"));

  const insertFounder = db.prepare(
    `INSERT OR REPLACE INTO founders (id, name, role, photo, bio, quote, focus, fun_fact, email, socials)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const f of raw.founders) {
    insertFounder.run(
      f.id, f.name, f.role, f.photo, f.bio, f.quote,
      JSON.stringify(f.focus), f.funFact, f.email, JSON.stringify(f.socials)
    );
  }

  const insertModule = db.prepare(
    `INSERT OR REPLACE INTO modules (id, number, title, tagline, description, icon, gradient)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const m of raw.modules) {
    insertModule.run(m.id, m.number, m.title, m.tagline, m.description, m.icon, m.gradient);
  }

  const insertLesson = db.prepare(
    `INSERT OR REPLACE INTO lessons (id, module_id, number, title, subtitle, summary, duration, difficulty, content, takeaways, action_steps, quiz)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const l of raw.lessons) {
    insertLesson.run(
      l.id, l.moduleId, l.number, l.title, l.subtitle, l.summary,
      l.duration, l.difficulty,
      JSON.stringify(l.content), JSON.stringify(l.takeaways),
      JSON.stringify(l.actionSteps), JSON.stringify(l.quiz)
    );
  }

  const insertVideo = db.prepare(
    `INSERT OR REPLACE INTO videos (id, module_id, title, channel, description, youtube_id, duration, level, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const v of raw.videos) {
    insertVideo.run(v.id, v.moduleId, v.title, v.channel, v.description, v.youtubeId, v.duration, v.level, JSON.stringify(v.tags));
  }

  const insertNiche = db.prepare(`INSERT OR REPLACE INTO niches (id, data) VALUES (?, ?)`);
  for (const n of raw.niches) insertNiche.run(n.id, JSON.stringify(n));

  const insertTestimonial = db.prepare(
    `INSERT OR REPLACE INTO testimonials (id, name, role, text, rating) VALUES (?, ?, ?, ?, ?)`
  );
  for (const t of raw.testimonials) {
    insertTestimonial.run(t.id ?? null, t.name, t.role, t.text, t.rating);
  }
}

const count = db.prepare("SELECT COUNT(*) AS c FROM founders").get().c;
if (count === 0 || process.env.RESEED === "1") {
  seed();
  console.log(`[db] seeded from ${SEED_FILE}`);
}

/* ------------------------------ helpers ------------------------------ */
const json = (res, code, body) => res.status(code).json(body);

function lessonRow(row) {
  return row && {
    id: row.id,
    moduleId: row.module_id,
    number: row.number,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    duration: row.duration,
    difficulty: row.difficulty,
    content: JSON.parse(row.content),
    takeaways: JSON.parse(row.takeaways),
    actionSteps: JSON.parse(row.action_steps),
    quiz: JSON.parse(row.quiz),
  };
}

function founderRow(row) {
  return row && {
    id: row.id,
    name: row.name,
    role: row.role,
    photo: row.photo,
    bio: row.bio,
    quote: row.quote,
    focus: JSON.parse(row.focus || "[]"),
    funFact: row.fun_fact,
    email: row.email,
    socials: JSON.parse(row.socials || "{}"),
  };
}

function videoRow(row) {
  return row && {
    id: row.id,
    title: row.title,
    channel: row.channel,
    description: row.description,
    youtubeId: row.youtube_id,
    moduleId: row.module_id,
    duration: row.duration,
    level: row.level,
    tags: JSON.parse(row.tags || "[]"),
  };
}

const tableCounts = () => {
  const tables = ["founders", "modules", "lessons", "videos", "niches", "testimonials", "contact_messages", "lesson_progress"];
  const out = {};
  for (const t of tables) out[t] = db.prepare(`SELECT COUNT(*) AS c FROM ${t}`).get().c;
  return out;
};

/* ------------------------------ app ------------------------------ */
const app = express();
app.use(express.json());

/* --- health --- */
app.get("/api/health", (_req, res) => {
  json(res, 200, {
    status: "ok",
    service: "billionaire-blueprint-api",
    db: "sqlite",
    tables: tableCounts(),
    time: new Date().toISOString(),
  });
});

/* --- stats --- */
app.get("/api/stats", (_req, res) => {
  const counts = tableCounts();
  const completed = db.prepare("SELECT COUNT(*) AS c FROM lesson_progress").get().c;
  const totalProgress = counts.lessons ? Math.round((completed / counts.lessons) * 100) : 0;
  json(res, 200, {
    founders: counts.founders,
    lessons: counts.lessons,
    modules: counts.modules,
    videos: counts.videos,
    niches: counts.niches,
    testimonials: counts.testimonials,
    contactMessages: counts.contact_messages,
    completedLessons: completed,
    totalProgress,
    database: counts,
  });
});

/* --- database inspection --- */
app.get("/api/database", (_req, res) => {
  const tables = tableCounts();
  const recentMessages = db
    .prepare("SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC LIMIT 10")
    .all();
  const recentProgress = db
    .prepare("SELECT client_id, lesson_id, completed_at FROM lesson_progress ORDER BY id DESC LIMIT 10")
    .all();
  json(res, 200, { engine: "sqlite (node:sqlite)", file: DB_PATH, tables, recentMessages, recentProgress });
});

/* --- founders --- */
app.get("/api/founders", (_req, res) => {
  const rows = db.prepare("SELECT * FROM founders ORDER BY id").all();
  json(res, 200, rows.map(founderRow));
});
app.get("/api/founders/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM founders WHERE id = ?").get(req.params.id);
  if (!row) return json(res, 404, { error: "Founder not found" });
  json(res, 200, founderRow(row));
});

/* --- modules --- */
app.get("/api/modules", (_req, res) => {
  const rows = db.prepare("SELECT * FROM modules ORDER BY number").all();
  json(res, 200, rows.map((m) => ({
    id: m.id,
    number: m.number,
    title: m.title,
    tagline: m.tagline,
    description: m.description,
    icon: m.icon,
    gradient: m.gradient,
    lessonCount: db.prepare("SELECT COUNT(*) AS c FROM lessons WHERE module_id = ?").get(m.id).c,
  })));
});

/* --- lessons --- */
app.get("/api/lessons", (_req, res) => {
  const rows = db.prepare("SELECT * FROM lessons ORDER BY number").all();
  json(res, 200, rows.map(lessonRow));
});
app.get("/api/lessons/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM lessons WHERE id = ?").get(req.params.id);
  if (!row) return json(res, 404, { error: "Lesson not found" });
  json(res, 200, lessonRow(row));
});

/* --- videos --- */
app.get("/api/videos", (_req, res) => {
  const rows = db.prepare("SELECT * FROM videos ORDER BY id").all();
  json(res, 200, rows.map(videoRow));
});

/* --- niches --- */
app.get("/api/niches", (_req, res) => {
  const rows = db.prepare("SELECT * FROM niches ORDER BY id").all();
  json(res, 200, rows.map((r) => JSON.parse(r.data)));
});
app.get("/api/niches/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM niches WHERE id = ?").get(req.params.id);
  if (!row) return json(res, 404, { error: "Niche not found" });
  json(res, 200, JSON.parse(row.data));
});

/* --- contact messages (database writes!) --- */
app.post("/api/contact", (req, res) => {
  const { name, email, subject = "General", message } = req.body || {};
  if (!name || !email || !message) {
    return json(res, 400, { error: "name, email and message are required" });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(res, 400, { error: "email is not valid" });
  }
  const createdAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(String(name).slice(0, 120), String(email).slice(0, 200), String(subject).slice(0, 200), String(message).slice(0, 5000), createdAt);
  json(res, 201, {
    id: Number(info.lastInsertRowid),
    name: String(name).slice(0, 120),
    email: String(email).slice(0, 200),
    subject: String(subject).slice(0, 200),
    message: String(message).slice(0, 5000),
    created_at: createdAt,
  });
});
app.get("/api/contact", (_req, res) => {
  const rows = db.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200").all();
  json(res, 200, rows);
});

/* --- lesson progress (database writes!) --- */
app.post("/api/progress", (req, res) => {
  const { clientId, lessonId } = req.body || {};
  if (!clientId || !lessonId) return json(res, 400, { error: "clientId and lessonId are required" });
  const exists = db.prepare("SELECT id FROM lessons WHERE id = ?").get(lessonId);
  if (!exists) return json(res, 404, { error: "Lesson not found" });
  db.prepare(
    "INSERT OR IGNORE INTO lesson_progress (client_id, lesson_id, completed_at) VALUES (?, ?, ?)"
  ).run(String(clientId).slice(0, 200), String(lessonId).slice(0, 200), new Date().toISOString());
  json(res, 200, { ok: true, lessonId, completed: true });
});
app.get("/api/progress", (req, res) => {
  const clientId = String(req.query.clientId || "").slice(0, 200);
  if (!clientId) return json(res, 400, { error: "clientId query param is required" });
  const rows = db.prepare("SELECT lesson_id FROM lesson_progress WHERE client_id = ?").all(clientId);
  json(res, 200, { clientId, lessonIds: rows.map((r) => r.lesson_id) });
});
app.delete("/api/progress", (req, res) => {
  const { clientId, lessonId } = req.body || {};
  if (!clientId || !lessonId) return json(res, 400, { error: "clientId and lessonId are required" });
  db.prepare("DELETE FROM lesson_progress WHERE client_id = ? AND lesson_id = ?").run(String(clientId).slice(0, 200), String(lessonId).slice(0, 200));
  json(res, 200, { ok: true, lessonId, completed: false });
});

/* --- static SPA (production) --- */
const DIST = join(ROOT, "dist");
if (existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback for client-side routes. Excludes real API paths (/api/...)
  // but still serves /api-docs, which is a frontend page.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(DIST, "index.html"));
  });
  console.log(`[web] serving static build from ${DIST}`);
} else {
  app.get("/", (_req, res) => {
    res
      .type("html")
      .send(
        "<h1>Billionaire Blueprint API</h1><p>API is running. Build the frontend with <code>npm run build</code> to serve the SPA, or run <code>npm run dev</code> for the Vite dev server.</p>"
      );
  });
}

/* --- 404 for unknown API routes (only real /api/ paths) --- */
app.use("/api/", (_req, res) => json(res, 404, { error: "Not found" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[server] Billionaire Blueprint API listening on http://0.0.0.0:${PORT}`);
  console.log(`[db] file at ${DB_PATH}`);
});
