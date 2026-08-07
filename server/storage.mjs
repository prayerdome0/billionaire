/**
 * Storage layer for Billionaire Blueprint.
 *
 * Adapters (auto-detected):
 *   1. Postgres   — if DATABASE_URL is set (Vercel Postgres / Neon / Supabase)
 *   2. Vercel KV  — if KV_REST_API_URL + KV_REST_API_TOKEN are set (Upstash Redis)
 *   3. Memory     — on Vercel serverless with no hosted store (ephemeral, always works)
 *   4. SQLite     — local development (Node built-in node:sqlite, no native deps)
 *
 * All adapters implement the same async interface, so the API layer is
 * storage-agnostic and deployable anywhere.
 */
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Single source of truth for all content — bundled with the serverless function. */
const seed = require("../src/data/content.json");

/* =============================== helpers =============================== */

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

function moduleRow(row) {
  return row && {
    id: row.id,
    number: row.number,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    icon: row.icon,
    gradient: row.gradient,
  };
}

function nowIso() {
  return new Date().toISOString();
}

/** Strip a clientId for public display. */
function maskClient(id) {
  return typeof id === "string" ? `#${id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}` : "#unknown";
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

/* =============================== SQLite =============================== */

class SqliteStore {
  constructor(dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.engine = "sqlite (node:sqlite)";
    this.file = dbPath;
    this._initSchema();
    this._seed();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS founders (
        id TEXT PRIMARY KEY, name TEXT, role TEXT, photo TEXT, bio TEXT,
        quote TEXT, focus TEXT, fun_fact TEXT, email TEXT, socials TEXT
      );
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY, number INTEGER, title TEXT, tagline TEXT,
        description TEXT, icon TEXT, gradient TEXT
      );
      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY, module_id TEXT, number INTEGER, title TEXT, subtitle TEXT,
        summary TEXT, duration TEXT, difficulty TEXT, content TEXT,
        takeaways TEXT, action_steps TEXT, quiz TEXT
      );
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY, module_id TEXT, title TEXT, channel TEXT,
        description TEXT, youtube_id TEXT, duration TEXT, level TEXT, tags TEXT
      );
      CREATE TABLE IF NOT EXISTS niches (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS posts (
        slug TEXT PRIMARY KEY, title TEXT, excerpt TEXT, author_id TEXT,
        date TEXT, read_time TEXT, tags TEXT, content TEXT
      );
      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, text TEXT, rating INTEGER
      );
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
        subject TEXT, message TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, lesson_id TEXT NOT NULL, client_id TEXT NOT NULL,
        name TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS investor_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
        phone TEXT, interest_area TEXT NOT NULL, amount_range TEXT, message TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
        completed_at TEXT NOT NULL, UNIQUE(client_id, lesson_id)
      );
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY, email TEXT, name TEXT, photo_url TEXT,
        role TEXT NOT NULL DEFAULT 'student', created_at TEXT, last_seen TEXT
      );
      CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY, uid TEXT NOT NULL, email TEXT, name_on_cert TEXT,
        completed INTEGER, total INTEGER, pct INTEGER,
        tuition_model TEXT DEFAULT 'FREE', fee_usd INTEGER DEFAULT 5,
        paid INTEGER DEFAULT 0, payment_status TEXT DEFAULT 'unpaid',
        payment_id TEXT, payment_method TEXT,
        certificate_number TEXT, incorporation_note TEXT,
        status TEXT DEFAULT 'eligible',
        claimed_at TEXT, issued_at TEXT, payment_at TEXT
      );
      CREATE TABLE IF NOT EXISTS certificate_payments (
        id TEXT PRIMARY KEY, uid TEXT NOT NULL, email TEXT,
        amount_usd INTEGER DEFAULT 5, currency TEXT DEFAULT 'USD',
        purpose TEXT DEFAULT 'certificate_fee', status TEXT DEFAULT 'pending',
        method TEXT, certificate_claim_id TEXT, created_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_progress_client ON lesson_progress(client_id);
      CREATE INDEX IF NOT EXISTS idx_inquiries_email ON investor_inquiries(email);
      CREATE INDEX IF NOT EXISTS idx_cert_uid ON certificates(uid);
      CREATE INDEX IF NOT EXISTS idx_cert_pay_uid ON certificate_payments(uid);
    `);
  }

  _seed() {
    if (this._count("founders") > 0) return;
    const insertFounder = this.db.prepare(
      `INSERT OR REPLACE INTO founders (id, name, role, photo, bio, quote, focus, fun_fact, email, socials)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const f of seed.founders)
      insertFounder.run(f.id, f.name, f.role, f.photo, f.bio, f.quote, JSON.stringify(f.focus), f.funFact, f.email, JSON.stringify(f.socials));

    const insertModule = this.db.prepare(
      `INSERT OR REPLACE INTO modules (id, number, title, tagline, description, icon, gradient) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const m of seed.modules) insertModule.run(m.id, m.number, m.title, m.tagline, m.description, m.icon, m.gradient);

    const insertLesson = this.db.prepare(
      `INSERT OR REPLACE INTO lessons (id, module_id, number, title, subtitle, summary, duration, difficulty, content, takeaways, action_steps, quiz)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const l of seed.lessons)
      insertLesson.run(l.id, l.moduleId, l.number, l.title, l.subtitle, l.summary, l.duration, l.difficulty,
        JSON.stringify(l.content), JSON.stringify(l.takeaways), JSON.stringify(l.actionSteps), JSON.stringify(l.quiz));

    const insertVideo = this.db.prepare(
      `INSERT OR REPLACE INTO videos (id, module_id, title, channel, description, youtube_id, duration, level, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const v of seed.videos)
      insertVideo.run(v.id, v.moduleId, v.title, v.channel, v.description, v.youtubeId, v.duration, v.level, JSON.stringify(v.tags));

    const insertNiche = this.db.prepare(`INSERT OR REPLACE INTO niches (id, data) VALUES (?, ?)`);
    for (const n of seed.niches) insertNiche.run(n.id, JSON.stringify(n));

    const insertPost = this.db.prepare(
      `INSERT OR REPLACE INTO posts (slug, title, excerpt, author_id, date, read_time, tags, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of seed.posts)
      insertPost.run(p.slug, p.title, p.excerpt, p.authorId, p.date, p.readTime, JSON.stringify(p.tags), JSON.stringify(p.content));

    const insertTestimonial = this.db.prepare(
      `INSERT OR REPLACE INTO testimonials (id, name, role, text, rating) VALUES (?, ?, ?, ?, ?)`
    );
    seed.testimonials.forEach((t, i) => insertTestimonial.run(i + 1, t.name, t.role, t.text, t.rating));
  }

  _count(table) {
    return this.db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
  }

  _tableCounts() {
    const tables = ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials", "contact_messages", "comments", "subscribers", "investor_inquiries", "lesson_progress", "users", "certificates", "certificate_payments"];
    const out = {};
    for (const t of tables) {
      try { out[t] = this._count(t); } catch { out[t] = 0; }
    }
    return out;
  }

  /* ---- content ---- */
  async listFounders() { return this.db.prepare("SELECT * FROM founders ORDER BY id").all().map(founderRow); }
  async getFounder(id) { return founderRow(this.db.prepare("SELECT * FROM founders WHERE id = ?").get(id)); }
  async listModules() {
    const rows = this.db.prepare("SELECT * FROM modules ORDER BY number").all();
    return rows.map((m) => ({
      ...moduleRow(m),
      lessonCount: this.db.prepare("SELECT COUNT(*) AS c FROM lessons WHERE module_id = ?").get(m.id).c,
    }));
  }
  async listLessons() { return this.db.prepare("SELECT * FROM lessons ORDER BY number").all().map(lessonRow); }
  async getLesson(id) { return lessonRow(this.db.prepare("SELECT * FROM lessons WHERE id = ?").get(id)); }
  async listVideos() { return this.db.prepare("SELECT * FROM videos ORDER BY id").all().map(videoRow); }
  async listNiches() { return this.db.prepare("SELECT * FROM niches ORDER BY id").all().map((r) => JSON.parse(r.data)); }
  async getNiche(id) { const r = this.db.prepare("SELECT * FROM niches WHERE id = ?").get(id); return r ? JSON.parse(r.data) : undefined; }
  async listPosts() {
    const rows = this.db.prepare("SELECT * FROM posts ORDER BY date DESC").all();
    return rows.map((r) => ({ slug: r.slug, title: r.title, excerpt: r.excerpt, authorId: r.author_id, date: r.date, readTime: r.read_time, tags: JSON.parse(r.tags), content: JSON.parse(r.content) }));
  }
  async getPost(slug) {
    const r = this.db.prepare("SELECT * FROM posts WHERE slug = ?").get(slug);
    return r ? { slug: r.slug, title: r.title, excerpt: r.excerpt, authorId: r.author_id, date: r.date, readTime: r.read_time, tags: JSON.parse(r.tags), content: JSON.parse(r.content) } : undefined;
  }
  async search(q) {
    const like = `%${q}%`;
    const lessons = this.db.prepare("SELECT * FROM lessons WHERE title LIKE ? OR summary LIKE ? OR subtitle LIKE ?").all(like, like, like).map(lessonRow);
    const videos = this.db.prepare("SELECT * FROM videos WHERE title LIKE ? OR description LIKE ? OR channel LIKE ?").all(like, like, like).map(videoRow);
    const niches = this.db.prepare("SELECT * FROM niches WHERE data LIKE ?").all(like).map((r) => JSON.parse(r.data));
    const founders = this.db.prepare("SELECT * FROM founders WHERE name LIKE ? OR bio LIKE ? OR role LIKE ?").all(like, like, like).map(founderRow);
    const posts = (await this.listPosts()).filter((p) => (p.title + p.excerpt + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));
    return { lessons, videos, niches, founders, posts };
  }

  /* ---- dynamic data ---- */
  async addMessage({ name, email, subject, message }) {
    const info = this.db.prepare("INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(String(name), String(email), subject, message, nowIso());
    return { id: Number(info.lastInsertRowid), name, email, subject, message, created_at: nowIso() };
  }
  async listMessages() { return this.db.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200").all(); }

  async addInvestorInquiry({ name, email, phone = "", interest_area, amount_range = "", message = "" }) {
    const info = this.db.prepare(
      "INSERT INTO investor_inquiries (name, email, phone, interest_area, amount_range, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(String(name), String(email), String(phone), String(interest_area), String(amount_range), String(message), nowIso());
    return {
      id: Number(info.lastInsertRowid),
      name, email, phone, interest_area, amount_range, message,
      created_at: nowIso(),
    };
  }
  async listInvestorInquiries() {
    return this.db.prepare("SELECT * FROM investor_inquiries ORDER BY id DESC LIMIT 200").all();
  }

  async addComment({ lessonId, clientId, name, text }) {
    const info = this.db.prepare("INSERT INTO comments (lesson_id, client_id, name, text, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(lessonId, clientId, String(name).slice(0, 80), String(text).slice(0, 2000), nowIso());
    return { id: Number(info.lastInsertRowid), lessonId, clientId: maskClient(clientId), name, text, created_at: nowIso() };
  }
  async listComments(lessonId) {
    const rows = this.db.prepare("SELECT * FROM comments WHERE lesson_id = ? ORDER BY id DESC LIMIT 100").all(lessonId);
    return rows.map((r) => ({ id: r.id, lessonId: r.lesson_id, clientId: maskClient(r.client_id), name: r.name, text: r.text, created_at: r.created_at }));
  }
  async leaderboard() {
    const rows = this.db.prepare(
      "SELECT client_id, COUNT(*) AS c FROM lesson_progress GROUP BY client_id ORDER BY c DESC LIMIT 20"
    ).all();
    return rows.map((r, i) => ({ rank: i + 1, clientId: maskClient(r.client_id), completed: r.c }));
  }

  async addSubscriber(email) {
    const normalized = normalizeEmail(email);
    this.db.prepare("INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)").run(normalized, nowIso());
    return { email: normalized, created_at: nowIso() };
  }
  async listSubscribers() { return this.db.prepare("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 200").all(); }

  async getProgress(clientId) {
    const rows = this.db.prepare("SELECT lesson_id FROM lesson_progress WHERE client_id = ?").all(clientId);
    return rows.map((r) => r.lesson_id);
  }
  async setProgress(clientId, lessonId) {
    const exists = this.db.prepare("SELECT id FROM lessons WHERE id = ?").get(lessonId);
    if (!exists) return false;
    this.db.prepare("INSERT OR IGNORE INTO lesson_progress (client_id, lesson_id, completed_at) VALUES (?, ?, ?)").run(clientId, lessonId, nowIso());
    return true;
  }
  async clearProgress(clientId, lessonId) {
    this.db.prepare("DELETE FROM lesson_progress WHERE client_id = ? AND lesson_id = ?").run(clientId, lessonId);
  }

  /* ---- meta ---- */
  async stats() {
    const counts = this._tableCounts();
    const completed = this._count("lesson_progress");
    return {
      founders: counts.founders, modules: counts.modules, lessons: counts.lessons, videos: counts.videos,
      niches: counts.niches, posts: counts.posts, testimonials: counts.testimonials,
      contactMessages: counts.contact_messages, comments: counts.comments, subscribers: counts.subscribers,
      investorInquiries: counts.investor_inquiries || 0,
      completedLessons: completed,
      totalProgress: counts.lessons ? Math.round((completed / counts.lessons) * 100) : 0,
      database: counts,
    };
  }
  async databaseInfo() {
    return {
      engine: this.engine,
      file: this.file,
      tables: this._tableCounts(),
      recentMessages: this.db.prepare("SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC LIMIT 10").all(),
      recentInvestorInquiries: this.db.prepare("SELECT id, name, email, interest_area, created_at FROM investor_inquiries ORDER BY id DESC LIMIT 10").all(),
      recentComments: this.db.prepare("SELECT id, lesson_id, name, text, created_at FROM comments ORDER BY id DESC LIMIT 10").all(),
      recentSubscribers: this.db.prepare("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 10").all(),
      recentProgress: this.db.prepare("SELECT client_id, lesson_id, completed_at FROM lesson_progress ORDER BY id DESC LIMIT 10").all(),
    };
  }
}

/* ============================= Vercel KV ============================= */

class KvStore {
  constructor(base, token) {
    this.base = String(base).replace(/\/+$/, "");
    this.token = token;
    this.engine = "vercel-kv (upstash redis)";
    this.file = "-";
    this.seeded = false;
  }

  async _fetch(path, opts = {}) {
    const headers = { Authorization: `Bearer ${this.token}`, ...(opts.headers || {}) };
    const res = await fetch(`${this.base}${path}`, { ...opts, headers });
    if (!res.ok) throw new Error(`KV ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async _get(key) {
    const j = await this._fetch(`/get/${key}`);
    return j.result ?? null; // Upstash returns the JSON-encoded value as a string
  }

  async _set(key, value) {
    return this._fetch(`/set/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
  }

  async _append(key, item) {
    const list = JSON.parse((await this._get(key)) || "[]");
    list.push(item);
    await this._set(key, list);
    return item;
  }

  async _ensureSeeded() {
    if (this.seeded) return;
    const flag = await this._get("bb:seeded");
    if (!flag) await this._set("bb:seeded", nowIso());
    this.seeded = true;
  }

  /* ---- content (served from the bundled seed) ---- */
  async listFounders() { await this._ensureSeeded(); return seed.founders; }
  async getFounder(id) { await this._ensureSeeded(); return seed.founders.find((f) => f.id === id); }
  async listModules() { await this._ensureSeeded(); return seed.modules.map((m) => ({ ...m, lessonCount: seed.lessons.filter((l) => l.moduleId === m.id).length })); }
  async listLessons() { await this._ensureSeeded(); return seed.lessons; }
  async getLesson(id) { await this._ensureSeeded(); return seed.lessons.find((l) => l.id === id); }
  async listVideos() { await this._ensureSeeded(); return seed.videos; }
  async listNiches() { await this._ensureSeeded(); return seed.niches; }
  async getNiche(id) { await this._ensureSeeded(); return seed.niches.find((n) => n.id === id); }
  async listPosts() { await this._ensureSeeded(); return [...seed.posts].sort((a, b) => b.date.localeCompare(a.date)); }
  async getPost(slug) { await this._ensureSeeded(); return seed.posts.find((p) => p.slug === slug); }
  async search(q) {
    await this._ensureSeeded();
    const needle = q.toLowerCase();
    const hit = (s) => s.toLowerCase().includes(needle);
    return {
      lessons: seed.lessons.filter((l) => hit(l.title) || hit(l.subtitle) || hit(l.summary)),
      videos: seed.videos.filter((v) => hit(v.title) || hit(v.description) || hit(v.channel)),
      niches: seed.niches.filter((n) => hit(n.title) || hit(n.description)),
      founders: seed.founders.filter((f) => hit(f.name) || hit(f.bio) || hit(f.role)),
      posts: seed.posts.filter((p) => hit(p.title) || hit(p.excerpt) || p.tags.some(hit)),
    };
  }

  /* ---- dynamic data ---- */
  async addMessage(msg) { await this._ensureSeeded(); return this._append("bb:messages", { id: Date.now(), ...msg, created_at: nowIso() }); }
  async listMessages() { await this._ensureSeeded(); return JSON.parse((await this._get("bb:messages")) || "[]").reverse().slice(0, 200); }
  async addInvestorInquiry(inquiry) { await this._ensureSeeded(); return this._append("bb:investors", { id: Date.now(), ...inquiry, created_at: nowIso() }); }
  async listInvestorInquiries() { await this._ensureSeeded(); return JSON.parse((await this._get("bb:investors")) || "[]").reverse().slice(0, 200); }

  async addComment({ lessonId, clientId, name, text }) {
    await this._ensureSeeded();
    const key = `bb:comments:${lessonId}`;
    const item = { id: Date.now(), lessonId, clientId: maskClient(clientId), name, text, created_at: nowIso() };
    await this._append(key, item);
    return item;
  }
  async listComments(lessonId) {
    await this._ensureSeeded();
    const list = JSON.parse((await this._get(`bb:comments:${lessonId}`)) || "[]");
    return [...list].reverse().slice(0, 100);
  }
  async leaderboard() {
    await this._ensureSeeded();
    const map = JSON.parse((await this._get("bb:progress")) || "{}");
    return Object.entries(map)
      .map(([clientId, ids]) => ({ clientId: maskClient(clientId), completed: ids.length }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 20)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }

  async addSubscriber(email) {
    await this._ensureSeeded();
    const normalized = normalizeEmail(email);
    const list = JSON.parse((await this._get("bb:subscribers")) || "[]");
    if (!list.some((s) => s.email === normalized)) {
      list.push({ id: Date.now(), email: normalized, created_at: nowIso() });
      await this._set("bb:subscribers", list);
    }
    return { email: normalized, created_at: nowIso() };
  }
  async listSubscribers() {
    await this._ensureSeeded();
    return JSON.parse((await this._get("bb:subscribers")) || "[]").reverse().slice(0, 200);
  }

  async getProgress(clientId) {
    await this._ensureSeeded();
    const map = JSON.parse((await this._get("bb:progress")) || "{}");
    return map[clientId] || [];
  }
  async setProgress(clientId, lessonId) {
    await this._ensureSeeded();
    const map = JSON.parse((await this._get("bb:progress")) || "{}");
    if (!seed.lessons.some((l) => l.id === lessonId)) return false;
    const list = map[clientId] || [];
    if (!list.includes(lessonId)) list.push(lessonId);
    map[clientId] = list;
    await this._set("bb:progress", map);
    return true;
  }
  async clearProgress(clientId, lessonId) {
    await this._ensureSeeded();
    const map = JSON.parse((await this._get("bb:progress")) || "{}");
    if (map[clientId]) map[clientId] = map[clientId].filter((id) => id !== lessonId);
    await this._set("bb:progress", map);
  }

  /* ---- meta ---- */
  async stats() {
    const dynamic = {
      contactMessages: (JSON.parse((await this._get("bb:messages")) || "[]")).length,
      subscribers: (JSON.parse((await this._get("bb:subscribers")) || "[]")).length,
      investorInquiries: (JSON.parse((await this._get("bb:investors")) || "[]")).length,
      comments: Object.keys(seed.lessons).length, // approximate; precise per-lesson below
    };
    const progress = JSON.parse((await this._get("bb:progress")) || "{}");
    const completed = Object.values(progress).flat().length;
    let commentCount = 0;
    for (const l of seed.lessons) commentCount += (JSON.parse((await this._get(`bb:comments:${l.id}`)) || "[]")).length;
    return {
      founders: seed.founders.length, modules: seed.modules.length, lessons: seed.lessons.length,
      videos: seed.videos.length, niches: seed.niches.length, posts: seed.posts.length,
      testimonials: seed.testimonials.length,
      contactMessages: dynamic.contactMessages, comments: commentCount, subscribers: dynamic.subscribers,
      investorInquiries: dynamic.investorInquiries,
      completedLessons: completed,
      totalProgress: seed.lessons.length ? Math.round((completed / seed.lessons.length) * 100) : 0,
      database: { seeded_content: "bundled json", contactMessages: dynamic.contactMessages, comments: commentCount, subscribers: dynamic.subscribers, investorInquiries: dynamic.investorInquiries, progress: Object.keys(progress).length },
    };
  }
  async databaseInfo() {
    const s = await this.stats();
    return {
      engine: this.engine,
      file: "managed (Upstash Redis REST)",
      tables: s.database,
      recentMessages: (await this.listMessages()).slice(0, 10),
      recentComments: [],
      recentSubscribers: (await this.listSubscribers()).slice(0, 10),
      recentProgress: (async () => {
        const map = JSON.parse((await this._get("bb:progress")) || "{}");
        const out = [];
        for (const [clientId, ids] of Object.entries(map))
          for (const lessonId of ids) out.push({ client_id: maskClient(clientId), lesson_id: lessonId, completed_at: "-" });
        return out.slice(0, 10);
      })(),
    };
  }
}

/* ============================== Postgres ============================== */

class PgStore {
  constructor(connectionString) {
    const { default: pg } = require("pg");
    this.pool = new pg.Pool({ connectionString, max: 5 });
    this.engine = "postgres";
    this.file = connectionString.replace(/\/\/[^@]*@/, "//***@");
  }

  async _q(text, params) {
    const res = await this.pool.query(text, params);
    return res;
  }

  async init() {
    await this._q(`
      CREATE TABLE IF NOT EXISTS founders (id TEXT PRIMARY KEY, name TEXT, role TEXT, photo TEXT, bio TEXT, quote TEXT, focus TEXT, fun_fact TEXT, email TEXT, socials TEXT);
      CREATE TABLE IF NOT EXISTS modules (id TEXT PRIMARY KEY, number INT, title TEXT, tagline TEXT, description TEXT, icon TEXT, gradient TEXT);
      CREATE TABLE IF NOT EXISTS lessons (id TEXT PRIMARY KEY, module_id TEXT, number INT, title TEXT, subtitle TEXT, summary TEXT, duration TEXT, difficulty TEXT, content TEXT, takeaways TEXT, action_steps TEXT, quiz TEXT);
      CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, module_id TEXT, title TEXT, channel TEXT, description TEXT, youtube_id TEXT, duration TEXT, level TEXT, tags TEXT);
      CREATE TABLE IF NOT EXISTS niches (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS posts (slug TEXT PRIMARY KEY, title TEXT, excerpt TEXT, author_id TEXT, date TEXT, read_time TEXT, tags TEXT, content TEXT);
      CREATE TABLE IF NOT EXISTS testimonials (id INT PRIMARY KEY, name TEXT, role TEXT, text TEXT, rating INT);
      CREATE TABLE IF NOT EXISTS contact_messages (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, lesson_id TEXT NOT NULL, client_id TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS subscribers (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS investor_inquiries (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, interest_area TEXT NOT NULL, amount_range TEXT, message TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS lesson_progress (id SERIAL PRIMARY KEY, client_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, UNIQUE(client_id, lesson_id));
      CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, email TEXT, name TEXT, photo_url TEXT, role TEXT NOT NULL DEFAULT 'student', created_at TEXT, last_seen TEXT);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_progress_client ON lesson_progress(client_id);
    `);
    const row = await this._q("SELECT COUNT(*) AS c FROM founders");
    if (Number(row.rows[0].c) === 0) await this._seed();
  }

  async _seed() {
    for (const f of seed.founders) {
      await this._q(
        `INSERT INTO founders (id, name, role, photo, bio, quote, focus, fun_fact, email, socials) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`,
        [f.id, f.name, f.role, f.photo, f.bio, f.quote, JSON.stringify(f.focus), f.funFact, f.email, JSON.stringify(f.socials)]
      );
    }
    for (const m of seed.modules) {
      await this._q(
        `INSERT INTO modules (id, number, title, tagline, description, icon, gradient) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title`,
        [m.id, m.number, m.title, m.tagline, m.description, m.icon, m.gradient]
      );
    }
    for (const l of seed.lessons) {
      await this._q(
        `INSERT INTO lessons (id, module_id, number, title, subtitle, summary, duration, difficulty, content, takeaways, action_steps, quiz)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title`,
        [l.id, l.moduleId, l.number, l.title, l.subtitle, l.summary, l.duration, l.difficulty,
         JSON.stringify(l.content), JSON.stringify(l.takeaways), JSON.stringify(l.actionSteps), JSON.stringify(l.quiz)]
      );
    }
    for (const v of seed.videos) {
      await this._q(
        `INSERT INTO videos (id, module_id, title, channel, description, youtube_id, duration, level, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title`,
        [v.id, v.moduleId, v.title, v.channel, v.description, v.youtubeId, v.duration, v.level, JSON.stringify(v.tags)]
      );
    }
    for (const n of seed.niches) {
      await this._q(`INSERT INTO niches (id, data) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data`, [n.id, JSON.stringify(n)]);
    }
    for (const p of seed.posts) {
      await this._q(
        `INSERT INTO posts (slug, title, excerpt, author_id, date, read_time, tags, content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title`,
        [p.slug, p.title, p.excerpt, p.authorId, p.date, p.readTime, JSON.stringify(p.tags), JSON.stringify(p.content)]
      );
    }
    seed.testimonials.forEach(async (t, i) => {
      await this._q(
        `INSERT INTO testimonials (id, name, role, text, rating) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`,
        [i + 1, t.name, t.role, t.text, t.rating]
      );
    });
  }

  async _count(table) {
    const r = await this._q(`SELECT COUNT(*) AS c FROM ${table}`);
    return Number(r.rows[0].c);
  }

  /* ---- content ---- */
  async listFounders() {
    const r = await this._q("SELECT * FROM founders ORDER BY id");
    return r.rows.map((row) => ({ id: row.id, name: row.name, role: row.role, photo: row.photo, bio: row.bio, quote: row.quote, focus: JSON.parse(row.focus || "[]"), funFact: row.fun_fact, email: row.email, socials: JSON.parse(row.socials || "{}") }));
  }
  async getFounder(id) {
    const r = await this._q("SELECT * FROM founders WHERE id = $1", [id]);
    if (!r.rows[0]) return undefined;
    const row = r.rows[0];
    return { id: row.id, name: row.name, role: row.role, photo: row.photo, bio: row.bio, quote: row.quote, focus: JSON.parse(row.focus || "[]"), funFact: row.fun_fact, email: row.email, socials: JSON.parse(row.socials || "{}") };
  }
  async listModules() {
    const r = await this._q("SELECT * FROM modules ORDER BY number");
    return Promise.all(r.rows.map(async (m) => ({ ...m, lessonCount: await this._countLessons(m.id) })));
  }
  async _countLessons(moduleId) {
    const r = await this._q("SELECT COUNT(*) AS c FROM lessons WHERE module_id = $1", [moduleId]);
    return Number(r.rows[0].c);
  }
  async listLessons() {
    const r = await this._q("SELECT * FROM lessons ORDER BY number");
    return r.rows.map((row) => lessonRow({ id: row.id, module_id: row.module_id, number: row.number, title: row.title, subtitle: row.subtitle, summary: row.summary, duration: row.duration, difficulty: row.difficulty, content: row.content, takeaways: row.takeaways, action_steps: row.action_steps, quiz: row.quiz }));
  }
  async getLesson(id) {
    const r = await this._q("SELECT * FROM lessons WHERE id = $1", [id]);
    if (!r.rows[0]) return undefined;
    const row = r.rows[0];
    return lessonRow({ id: row.id, module_id: row.module_id, number: row.number, title: row.title, subtitle: row.subtitle, summary: row.summary, duration: row.duration, difficulty: row.difficulty, content: row.content, takeaways: row.takeaways, action_steps: row.action_steps, quiz: row.quiz });
  }
  async listVideos() {
    const r = await this._q("SELECT * FROM videos ORDER BY id");
    return r.rows.map((row) => videoRow({ id: row.id, title: row.title, channel: row.channel, description: row.description, youtube_id: row.youtube_id, module_id: row.module_id, duration: row.duration, level: row.level, tags: row.tags }));
  }
  async listNiches() {
    const r = await this._q("SELECT * FROM niches ORDER BY id");
    return r.rows.map((x) => JSON.parse(x.data));
  }
  async getNiche(id) {
    const r = await this._q("SELECT * FROM niches WHERE id = $1", [id]);
    return r.rows[0] ? JSON.parse(r.rows[0].data) : undefined;
  }
  async listPosts() {
    const r = await this._q("SELECT * FROM posts ORDER BY date DESC");
    return r.rows.map((x) => ({ slug: x.slug, title: x.title, excerpt: x.excerpt, authorId: x.author_id, date: x.date, readTime: x.read_time, tags: JSON.parse(x.tags), content: JSON.parse(x.content) }));
  }
  async getPost(slug) {
    const r = await this._q("SELECT * FROM posts WHERE slug = $1", [slug]);
    if (!r.rows[0]) return undefined;
    const x = r.rows[0];
    return { slug: x.slug, title: x.title, excerpt: x.excerpt, authorId: x.author_id, date: x.date, readTime: x.read_time, tags: JSON.parse(x.tags), content: JSON.parse(x.content) };
  }
  async search(q) {
    const needle = `%${q}%`;
    const [lessons, videos, niches, founders] = await Promise.all([
      this._q("SELECT * FROM lessons WHERE title ILIKE $1 OR summary ILIKE $1 OR subtitle ILIKE $1", [needle]),
      this._q("SELECT * FROM videos WHERE title ILIKE $1 OR description ILIKE $1 OR channel ILIKE $1", [needle]),
      this._q("SELECT * FROM niches WHERE data ILIKE $1", [needle]),
      this._q("SELECT * FROM founders WHERE name ILIKE $1 OR bio ILIKE $1 OR role ILIKE $1", [needle]),
    ]);
    return {
      lessons: lessons.rows.map((row) => lessonRow(row)),
      videos: videos.rows.map((row) => videoRow(row)),
      niches: niches.rows.map((x) => JSON.parse(x.data)),
      founders: founders.rows.map((row) => founderRow(row)),
      posts: (await this.listPosts()).filter((p) => (p.title + p.excerpt + p.tags.join(" ")).toLowerCase().includes(q.toLowerCase())),
    };
  }

  /* ---- dynamic ---- */
  async addMessage({ name, email, subject, message }) {
    const r = await this._q(
      "INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at",
      [String(name), String(email), subject, message, nowIso()]
    );
    return { id: Number(r.rows[0].id), name, email, subject, message, created_at: r.rows[0].created_at };
  }
  async listMessages() {
    const r = await this._q("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 200");
    return r.rows;
  }
  async addInvestorInquiry({ name, email, phone = "", interest_area, amount_range = "", message = "" }) {
    const r = await this._q(
      "INSERT INTO investor_inquiries (name, email, phone, interest_area, amount_range, message, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at",
      [String(name), String(email), String(phone), String(interest_area), String(amount_range), String(message), nowIso()]
    );
    return {
      id: Number(r.rows[0].id),
      name, email, phone, interest_area, amount_range, message,
      created_at: r.rows[0].created_at,
    };
  }
  async listInvestorInquiries() {
    const r = await this._q("SELECT * FROM investor_inquiries ORDER BY id DESC LIMIT 200");
    return r.rows;
  }
  async addComment({ lessonId, clientId, name, text }) {
    const r = await this._q(
      "INSERT INTO comments (lesson_id, client_id, name, text, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at",
      [lessonId, clientId, String(name).slice(0, 80), String(text).slice(0, 2000), nowIso()]
    );
    return { id: Number(r.rows[0].id), lessonId, clientId: maskClient(clientId), name, text, created_at: r.rows[0].created_at };
  }
  async listComments(lessonId) {
    const r = await this._q("SELECT * FROM comments WHERE lesson_id = $1 ORDER BY id DESC LIMIT 100", [lessonId]);
    return r.rows.map((x) => ({ id: Number(x.id), lessonId: x.lesson_id, clientId: maskClient(x.client_id), name: x.name, text: x.text, created_at: x.created_at }));
  }
  async leaderboard() {
    const r = await this._q("SELECT client_id, COUNT(*) AS c FROM lesson_progress GROUP BY client_id ORDER BY c DESC LIMIT 20");
    return r.rows.map((x, i) => ({ rank: i + 1, clientId: maskClient(x.client_id), completed: Number(x.c) }));
  }
  async addSubscriber(email) {
    const normalized = normalizeEmail(email);
    await this._q("INSERT INTO subscribers (email, created_at) VALUES ($1,$2) ON CONFLICT (email) DO NOTHING", [normalized, nowIso()]);
    return { email: normalized, created_at: nowIso() };
  }
  async listSubscribers() {
    const r = await this._q("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 200");
    return r.rows;
  }
  async getProgress(clientId) {
    const r = await this._q("SELECT lesson_id FROM lesson_progress WHERE client_id = $1", [clientId]);
    return r.rows.map((x) => x.lesson_id);
  }
  async setProgress(clientId, lessonId) {
    const lesson = await this._q("SELECT id FROM lessons WHERE id = $1", [lessonId]);
    if (!lesson.rows[0]) return false;
    await this._q("INSERT INTO lesson_progress (client_id, lesson_id, completed_at) VALUES ($1,$2,$3) ON CONFLICT (client_id, lesson_id) DO NOTHING", [clientId, lessonId, nowIso()]);
    return true;
  }
  async clearProgress(clientId, lessonId) {
    await this._q("DELETE FROM lesson_progress WHERE client_id = $1 AND lesson_id = $2", [clientId, lessonId]);
  }

  /* ---- meta ---- */
  async stats() {
    const [f, mo, l, v, n, p, t, cm, co, su, inv, pr, us] = await Promise.all([
      this._count("founders"), this._count("modules"), this._count("lessons"), this._count("videos"),
      this._count("niches"), this._count("posts"), this._count("testimonials"), this._count("contact_messages"),
      this._count("comments"), this._count("subscribers"), this._count("investor_inquiries"), this._count("lesson_progress"),
      this._count("users"),
    ]);
    return {
      founders: f, modules: mo, lessons: l, videos: v, niches: n, posts: p, testimonials: t,
      contactMessages: cm, comments: co, subscribers: su, investorInquiries: inv, completedLessons: pr,
      users: us,
      totalProgress: l ? Math.round((pr / l) * 100) : 0,
      database: { founders: f, modules: mo, lessons: l, videos: v, niches: n, posts: p, testimonials: t, contact_messages: cm, comments: co, subscribers: su, investor_inquiries: inv, lesson_progress: pr, users: us },
    };
  }
  async databaseInfo() {
    const counts = {};
    for (const t of ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials", "contact_messages", "comments", "subscribers", "investor_inquiries", "lesson_progress", "users"]) counts[t] = await this._count(t);
    const [messages, comments, subscribers, inquiries, progress] = await Promise.all([
      this._q("SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC LIMIT 10"),
      this._q("SELECT id, lesson_id, name, text, created_at FROM comments ORDER BY id DESC LIMIT 10"),
      this._q("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 10"),
      this._q("SELECT id, name, email, interest_area, created_at FROM investor_inquiries ORDER BY id DESC LIMIT 10"),
      this._q("SELECT client_id, lesson_id, completed_at FROM lesson_progress ORDER BY id DESC LIMIT 10"),
    ]);
    return {
      engine: this.engine,
      file: this.file,
      tables: counts,
      recentMessages: messages.rows,
      recentInvestorInquiries: inquiries.rows,
      recentComments: comments.rows,
      recentSubscribers: subscribers.rows,
      recentProgress: progress.rows,
    };
  }
}

/* ============================== Memory ============================== */

class MemoryStore {
  constructor() {
    this.engine = "memory (ephemeral)";
    this.file = "-";
    this.messages = [];
    this.comments = [];
    this.subscribers = [];
    this.investorInquiries = [];
    this.progress = {};
    this._id = 1;
  }
  async listFounders() { return seed.founders; }
  async getFounder(id) { return seed.founders.find((f) => f.id === id); }
  async listModules() { return seed.modules.map((m) => ({ ...m, lessonCount: seed.lessons.filter((l) => l.moduleId === m.id).length })); }
  async listLessons() { return seed.lessons; }
  async getLesson(id) { return seed.lessons.find((l) => l.id === id); }
  async listVideos() { return seed.videos; }
  async listNiches() { return seed.niches; }
  async getNiche(id) { return seed.niches.find((n) => n.id === id); }
  async listPosts() { return [...seed.posts].sort((a, b) => b.date.localeCompare(a.date)); }
  async getPost(slug) { return seed.posts.find((p) => p.slug === slug); }
  async search(q) {
    const needle = q.toLowerCase();
    const hit = (s) => s.toLowerCase().includes(needle);
    return {
      lessons: seed.lessons.filter((l) => hit(l.title) || hit(l.subtitle) || hit(l.summary)),
      videos: seed.videos.filter((v) => hit(v.title) || hit(v.description) || hit(v.channel)),
      niches: seed.niches.filter((n) => hit(n.title) || hit(n.description)),
      founders: seed.founders.filter((f) => hit(f.name) || hit(f.bio) || hit(f.role)),
      posts: seed.posts.filter((p) => hit(p.title) || hit(p.excerpt) || p.tags.some(hit)),
    };
  }
  async addMessage(msg) { const item = { id: this._id++, ...msg, created_at: nowIso() }; this.messages.push(item); return item; }
  async listMessages() { return [...this.messages].reverse().slice(0, 200); }
  async addInvestorInquiry(inquiry) { const item = { id: this._id++, ...inquiry, created_at: nowIso() }; this.investorInquiries.push(item); return item; }
  async listInvestorInquiries() { return [...this.investorInquiries].reverse().slice(0, 200); }
  async addComment({ lessonId, clientId, name, text }) {
    const item = { id: this._id++, lessonId, clientId: maskClient(clientId), name, text, created_at: nowIso() };
    this.comments.push(item);
    return item;
  }
  async listComments(lessonId) { return this.comments.filter((c) => c.lessonId === lessonId).reverse().slice(0, 100); }
  async leaderboard() {
    return Object.entries(this.progress)
      .map(([clientId, ids]) => ({ clientId: maskClient(clientId), completed: ids.length }))
      .sort((a, b) => b.completed - a.completed).slice(0, 20)
      .map((e, i) => ({ rank: i + 1, ...e }));
  }
  async addSubscriber(email) {
    const normalized = normalizeEmail(email);
    if (!this.subscribers.some((s) => s.email === normalized)) this.subscribers.push({ id: this._id++, email: normalized, created_at: nowIso() });
    return { email: normalized, created_at: nowIso() };
  }
  async listSubscribers() { return [...this.subscribers].reverse().slice(0, 200); }
  async getProgress(clientId) { return this.progress[clientId] || []; }
  async setProgress(clientId, lessonId) {
    if (!seed.lessons.some((l) => l.id === lessonId)) return false;
    if (!this.progress[clientId]) this.progress[clientId] = [];
    if (!this.progress[clientId].includes(lessonId)) this.progress[clientId].push(lessonId);
    return true;
  }
  async clearProgress(clientId, lessonId) {
    if (this.progress[clientId]) this.progress[clientId] = this.progress[clientId].filter((id) => id !== lessonId);
  }
  async stats() {
    const completed = Object.values(this.progress).flat().length;
    return {
      founders: seed.founders.length, modules: seed.modules.length, lessons: seed.lessons.length,
      videos: seed.videos.length, niches: seed.niches.length, posts: seed.posts.length,
      testimonials: seed.testimonials.length, contactMessages: this.messages.length,
      comments: this.comments.length, subscribers: this.subscribers.length,
      investorInquiries: this.investorInquiries.length,
      completedLessons: completed,
      totalProgress: seed.lessons.length ? Math.round((completed / seed.lessons.length) * 100) : 0,
      database: { contactMessages: this.messages.length, comments: this.comments.length, subscribers: this.subscribers.length, investorInquiries: this.investorInquiries.length, progress: Object.keys(this.progress).length },
    };
  }
  async databaseInfo() {
    const s = await this.stats();
    return {
      engine: this.engine,
      file: "in-memory (resets on redeploy)",
      tables: s.database,
      recentMessages: [...this.messages].reverse().slice(0, 10).map(({ id, name, email, subject, created_at }) => ({ id, name, email, subject, created_at })),
      recentInvestorInquiries: [...this.investorInquiries].reverse().slice(0, 10).map(({ id, name, email, interest_area, created_at }) => ({ id, name, email, interest_area, created_at })),
      recentComments: [...this.comments].reverse().slice(0, 10),
      recentSubscribers: [...this.subscribers].reverse().slice(0, 10).map(({ id, email, created_at }) => ({ id, email, created_at })),
      recentProgress: Object.entries(this.progress).flatMap(([clientId, ids]) => ids.map((lessonId) => ({ client_id: maskClient(clientId), lesson_id: lessonId, completed_at: "-" }))).slice(0, 10),
    };
  }
}

/* ===================================================================== */
/* ============ Admin capabilities (all engines, uniform API) ========== */
/* ===================================================================== */

/** Tables the admin console may browse / delete rows from (key = table, value = primary key column for SQL engines). */
const ADMIN_TABLE_KEYS = {
  founders: "id",
  modules: "id",
  lessons: "id",
  videos: "id",
  niches: "id",
  posts: "slug",
  testimonials: "id",
  contact_messages: "id",
  comments: "id",
  subscribers: "id",
  investor_inquiries: "id",
  lesson_progress: "id",
  users: "uid",
  certificates: "id",
  certificate_payments: "id",
};
const ADMIN_TABLES = Object.keys(ADMIN_TABLE_KEYS);

function userRow(row) {
  return (
    row && {
      uid: row.uid,
      email: row.email,
      name: row.name,
      photoUrl: row.photo_url,
      role: row.role || "student",
      created_at: row.created_at,
      last_seen: row.last_seen,
    }
  );
}

function lessonInsertRow(l) {
  return [
    l.id, l.moduleId, l.number ?? 0, l.title ?? "", l.subtitle ?? "", l.summary ?? "",
    l.duration ?? "", l.difficulty ?? "", JSON.stringify(l.content ?? []),
    JSON.stringify(l.takeaways ?? []), JSON.stringify(l.actionSteps ?? []), JSON.stringify(l.quiz ?? []),
  ];
}
function founderInsertRow(f) {
  return [f.id, f.name ?? "", f.role ?? "", f.photo ?? "", f.bio ?? "", f.quote ?? "", JSON.stringify(f.focus ?? []), f.funFact ?? "", f.email ?? "", JSON.stringify(f.socials ?? {})];
}
function videoInsertRow(v) {
  return [v.id, v.moduleId ?? "", v.title ?? "", v.channel ?? "", v.description ?? "", v.youtubeId ?? "", v.duration ?? "", v.level ?? "", JSON.stringify(v.tags ?? [])];
}
function moduleInsertRow(m) {
  return [m.id, m.number ?? 0, m.title ?? "", m.tagline ?? "", m.description ?? "", m.icon ?? "", m.gradient ?? ""];
}
function postInsertRow(p) {
  return [p.slug, p.title ?? "", p.excerpt ?? "", p.authorId ?? "", p.date ?? nowIso().slice(0, 10), p.readTime ?? "", JSON.stringify(p.tags ?? []), JSON.stringify(p.content ?? [])];
}

/* ------------------------------ SQLite admin ------------------------------ */
Object.assign(SqliteStore.prototype, {
  async upsertUser(u) {
    const now = nowIso();
    this.db.prepare(
      `INSERT INTO users (uid, email, name, photo_url, role, created_at, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET email=excluded.email, name=excluded.name, photo_url=excluded.photo_url, last_seen=excluded.last_seen`
    ).run(u.uid, u.email || "", u.name || "", u.photoUrl || "", u.role || "student", u.createdAt || now, now);
    return userRow(this.db.prepare("SELECT * FROM users WHERE uid = ?").get(u.uid));
  },
  async getUser(uid) {
    return userRow(this.db.prepare("SELECT * FROM users WHERE uid = ?").get(uid));
  },
  async listUsers() {
    return this.db.prepare("SELECT * FROM users ORDER BY last_seen DESC LIMIT 500").all().map(userRow);
  },
  async setUserRole(uid, role) {
    const r = role === "admin" ? "admin" : "student";
    this.db.prepare("INSERT INTO users (uid, email, name, role, created_at, last_seen) VALUES (?, '', '', ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET role=excluded.role")
      .run(uid, r, nowIso(), nowIso());
    this.db.prepare("UPDATE users SET role = ? WHERE uid = ?").run(r, uid);
    return userRow(this.db.prepare("SELECT * FROM users WHERE uid = ?").get(uid));
  },
  async deleteUser(uid) {
    this.db.prepare("DELETE FROM users WHERE uid = ?").run(uid);
  },
  async dumpTable(table) {
    if (!ADMIN_TABLES.includes(table)) throw new Error(`Unknown table: ${table}`);
    return this.db.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 300`).all();
  },
  async deleteRecord(table, key) {
    const col = ADMIN_TABLE_KEYS[table];
    if (!col) throw new Error(`Unknown table: ${table}`);
    const info = this.db.prepare(`DELETE FROM ${table} WHERE ${col} = ?`).run(String(key));
    return Number(info.changes) > 0;
  },
  async adminTables() {
    return ADMIN_TABLES.map((name) => ({ name, count: this._count(name) }));
  },
  async upsertLesson(l) {
    this.db.prepare(`INSERT OR REPLACE INTO lessons (id, module_id, number, title, subtitle, summary, duration, difficulty, content, takeaways, action_steps, quiz) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(...lessonInsertRow(l));
    return this.getLesson(l.id);
  },
  async deleteLesson(id) { this.db.prepare("DELETE FROM lessons WHERE id = ?").run(id); },
  async upsertVideo(v) {
    this.db.prepare(`INSERT OR REPLACE INTO videos (id, module_id, title, channel, description, youtube_id, duration, level, tags) VALUES (?,?,?,?,?,?,?,?,?)`).run(...videoInsertRow(v));
    return this.getVideo(v.id);
  },
  async deleteVideo(id) { this.db.prepare("DELETE FROM videos WHERE id = ?").run(id); },
  async getVideo(id) { return videoRow(this.db.prepare("SELECT * FROM videos WHERE id = ?").get(id)); },
  async upsertNiche(n) {
    this.db.prepare("INSERT OR REPLACE INTO niches (id, data) VALUES (?, ?)").run(n.id, JSON.stringify(n));
    return this.getNiche(n.id);
  },
  async deleteNiche(id) { this.db.prepare("DELETE FROM niches WHERE id = ?").run(id); },
  async upsertFounder(f) {
    this.db.prepare(`INSERT OR REPLACE INTO founders (id, name, role, photo, bio, quote, focus, fun_fact, email, socials) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(...founderInsertRow(f));
    return this.getFounder(f.id);
  },
  async deleteFounder(id) { this.db.prepare("DELETE FROM founders WHERE id = ?").run(id); },
  async upsertPost(p) {
    this.db.prepare(`INSERT OR REPLACE INTO posts (slug, title, excerpt, author_id, date, read_time, tags, content) VALUES (?,?,?,?,?,?,?,?)`).run(...postInsertRow(p));
    return this.getPost(p.slug);
  },
  async deletePost(slug) { this.db.prepare("DELETE FROM posts WHERE slug = ?").run(slug); },
  async upsertModule(m) {
    this.db.prepare(`INSERT OR REPLACE INTO modules (id, number, title, tagline, description, icon, gradient) VALUES (?,?,?,?,?,?,?)`).run(...moduleInsertRow(m));
    return this.db.prepare("SELECT * FROM modules WHERE id = ?").get(m.id);
  },
  async getModule(id) {
    const r = this.db.prepare("SELECT * FROM modules WHERE id = ?").get(id);
    return r ? moduleRow(r) : undefined;
  },
  async deleteModule(id) { this.db.prepare("DELETE FROM modules WHERE id = ?").run(id); },
  async reseed() {
    for (const t of ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials"])
      this.db.prepare(`DELETE FROM ${t}`).run();
    this._seed();
    return this._tableCounts();
  },
  async leaderboard() {
    const rows = this.db.prepare(
      `SELECT p.client_id AS cid, COUNT(*) AS c, u.name AS uname
       FROM lesson_progress p LEFT JOIN users u ON u.uid = p.client_id
       GROUP BY p.client_id ORDER BY c DESC LIMIT 20`
    ).all();
    return rows.map((r, i) => ({
      rank: i + 1,
      clientId: maskClient(r.cid),
      name: r.uname || `Student ${maskClient(r.cid)}`,
      completed: r.c,
    }));
  },
  /* ---- certificates ($5 paid, tuition FREE, incorporation) ---- */
  async upsertCertificate(c) {
    this.db.prepare(
      `INSERT INTO certificates (id, uid, email, name_on_cert, completed, total, pct, tuition_model, fee_usd, paid, payment_status, payment_id, payment_method, certificate_number, incorporation_note, status, claimed_at, issued_at, payment_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET email=excluded.email, name_on_cert=excluded.name_on_cert, completed=excluded.completed, total=excluded.total, pct=excluded.pct, paid=excluded.paid, payment_status=excluded.payment_status, payment_id=excluded.payment_id, payment_method=excluded.payment_method, status=excluded.status, issued_at=excluded.issued_at, payment_at=excluded.payment_at`
    ).run(
      c.id, c.uid, c.email || "", c.nameOnCert || c.name_on_cert || "", c.completed || 0, c.total || 0, c.pct || c.percentage || 0,
      c.tuitionModel || "FREE", c.feeUsd || 5, c.paid ? 1 : 0, c.paymentStatus || "unpaid", c.paymentId || "", c.paymentMethod || "",
      c.certificateNumber || "", c.incorporationNote || "Certificate Incorporation 2025 - No physical school built yet",
      c.status || "eligible", c.claimedAt || nowIso(), c.issuedAt || "", c.paymentAt || ""
    );
    return this.getCertificate(c.id);
  },
  async getCertificate(id) {
    return this.db.prepare("SELECT * FROM certificates WHERE id = ?").get(id);
  },
  async getCertificateByUid(uid) {
    return this.db.prepare("SELECT * FROM certificates WHERE uid = ?").get(uid);
  },
  async listCertificates() {
    return this.db.prepare("SELECT * FROM certificates ORDER BY claimed_at DESC LIMIT 200").all();
  },
  async markCertificatePaid(id, paymentId, method) {
    this.db.prepare("UPDATE certificates SET paid=1, payment_status='paid', payment_id=?, payment_method=?, status='claimed', issued_at=?, payment_at=? WHERE id=?")
      .run(paymentId, method, nowIso(), nowIso(), id);
    return this.getCertificate(id);
  },
  async addCertificatePayment(p) {
    this.db.prepare(
      `INSERT OR REPLACE INTO certificate_payments (id, uid, email, amount_usd, currency, purpose, status, method, certificate_claim_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(p.id, p.uid, p.email || "", p.amountUsd || 5, p.currency || "USD", p.purpose || "certificate_fee", p.status || "pending", p.method || "", p.certificateClaimId || "", p.createdAt || nowIso());
    return this.db.prepare("SELECT * FROM certificate_payments WHERE id = ?").get(p.id);
  },
  async confirmCertificatePayment(id, status) {
    this.db.prepare("UPDATE certificate_payments SET status=? WHERE id=?").run(status, id);
  },
  async listCertificatePayments() {
    return this.db.prepare("SELECT * FROM certificate_payments ORDER BY created_at DESC LIMIT 200").all();
  },
});

/* ------------------------------ Postgres admin ------------------------------ */
Object.assign(PgStore.prototype, {
  async upsertUser(u) {
    const now = nowIso();
    await this._q(
      `INSERT INTO users (uid, email, name, photo_url, role, created_at, last_seen) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (uid) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, photo_url=EXCLUDED.photo_url, last_seen=EXCLUDED.last_seen`,
      [u.uid, u.email || "", u.name || "", u.photoUrl || "", u.role || "student", u.createdAt || now, now]
    );
    return this.getUser(u.uid);
  },
  async getUser(uid) {
    const r = await this._q("SELECT * FROM users WHERE uid = $1", [uid]);
    return userRow(r.rows[0]);
  },
  async listUsers() {
    const r = await this._q("SELECT * FROM users ORDER BY last_seen DESC LIMIT 500");
    return r.rows.map(userRow);
  },
  async setUserRole(uid, role) {
    const r = role === "admin" ? "admin" : "student";
    const now = nowIso();
    await this._q(
      `INSERT INTO users (uid, email, name, role, created_at, last_seen) VALUES ($1,'','',$2,$3,$4)
       ON CONFLICT (uid) DO UPDATE SET role=EXCLUDED.role`,
      [uid, r, now, now]
    );
    return this.getUser(uid);
  },
  async deleteUser(uid) { await this._q("DELETE FROM users WHERE uid = $1", [uid]); },
  async dumpTable(table) {
    if (!ADMIN_TABLES.includes(table)) throw new Error(`Unknown table: ${table}`);
    const r = await this._q(`SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 300`);
    return r.rows;
  },
  async deleteRecord(table, key) {
    const col = ADMIN_TABLE_KEYS[table];
    if (!col) throw new Error(`Unknown table: ${table}`);
    const r = await this._q(`DELETE FROM ${table} WHERE ${col} = $1`, [String(key)]);
    return (r.rowCount || 0) > 0;
  },
  async adminTables() {
    const out = [];
    for (const name of ADMIN_TABLES) out.push({ name, count: await this._count(name) });
    return out;
  },
  async upsertLesson(l) {
    await this._q(
      `INSERT INTO lessons (id, module_id, number, title, subtitle, summary, duration, difficulty, content, takeaways, action_steps, quiz)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET module_id=EXCLUDED.module_id, number=EXCLUDED.number, title=EXCLUDED.title, subtitle=EXCLUDED.subtitle,
         summary=EXCLUDED.summary, duration=EXCLUDED.duration, difficulty=EXCLUDED.difficulty, content=EXCLUDED.content,
         takeaways=EXCLUDED.takeaways, action_steps=EXCLUDED.action_steps, quiz=EXCLUDED.quiz`,
      lessonInsertRow(l)
    );
    return this.getLesson(l.id);
  },
  async deleteLesson(id) { await this._q("DELETE FROM lessons WHERE id = $1", [id]); },
  async upsertVideo(v) {
    await this._q(
      `INSERT INTO videos (id, module_id, title, channel, description, youtube_id, duration, level, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET module_id=EXCLUDED.module_id, title=EXCLUDED.title, channel=EXCLUDED.channel, description=EXCLUDED.description,
         youtube_id=EXCLUDED.youtube_id, duration=EXCLUDED.duration, level=EXCLUDED.level, tags=EXCLUDED.tags`,
      videoInsertRow(v)
    );
    return this.getVideo(v.id);
  },
  async getVideo(id) {
    const r = await this._q("SELECT * FROM videos WHERE id = $1", [id]);
    return r.rows[0] ? videoRow(r.rows[0]) : undefined;
  },
  async deleteVideo(id) { await this._q("DELETE FROM videos WHERE id = $1", [id]); },
  async upsertNiche(n) {
    await this._q("INSERT INTO niches (id, data) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET data=EXCLUDED.data", [n.id, JSON.stringify(n)]);
    return this.getNiche(n.id);
  },
  async deleteNiche(id) { await this._q("DELETE FROM niches WHERE id = $1", [id]); },
  async upsertFounder(f) {
    await this._q(
      `INSERT INTO founders (id, name, role, photo, bio, quote, focus, fun_fact, email, socials) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role, photo=EXCLUDED.photo, bio=EXCLUDED.bio, quote=EXCLUDED.quote,
         focus=EXCLUDED.focus, fun_fact=EXCLUDED.fun_fact, email=EXCLUDED.email, socials=EXCLUDED.socials`,
      founderInsertRow(f)
    );
    return this.getFounder(f.id);
  },
  async deleteFounder(id) { await this._q("DELETE FROM founders WHERE id = $1", [id]); },
  async upsertPost(p) {
    await this._q(
      `INSERT INTO posts (slug, title, excerpt, author_id, date, read_time, tags, content) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, excerpt=EXCLUDED.excerpt, author_id=EXCLUDED.author_id, date=EXCLUDED.date,
         read_time=EXCLUDED.read_time, tags=EXCLUDED.tags, content=EXCLUDED.content`,
      postInsertRow(p)
    );
    return this.getPost(p.slug);
  },
  async deletePost(slug) { await this._q("DELETE FROM posts WHERE slug = $1", [slug]); },
  async upsertModule(m) {
    await this._q(
      `INSERT INTO modules (id, number, title, tagline, description, icon, gradient) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id) DO UPDATE SET number=EXCLUDED.number, title=EXCLUDED.title, tagline=EXCLUDED.tagline, description=EXCLUDED.description, icon=EXCLUDED.icon, gradient=EXCLUDED.gradient`,
      moduleInsertRow(m)
    );
    return this.getModule(m.id);
  },
  async getModule(id) {
    const r = await this._q("SELECT * FROM modules WHERE id = $1", [id]);
    if (!r.rows[0]) return undefined;
    const m = r.rows[0];
    return { id: m.id, number: m.number, title: m.title, tagline: m.tagline, description: m.description, icon: m.icon, gradient: m.gradient };
  },
  async deleteModule(id) { await this._q("DELETE FROM modules WHERE id = $1", [id]); },
  async reseed() {
    for (const t of ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials"])
      await this._q(`DELETE FROM ${t}`);
    await this._seed();
    return this.databaseInfo();
  },
  async leaderboard() {
    const r = await this._q(
      `SELECT p.client_id AS cid, COUNT(*) AS c, u.name AS uname
       FROM lesson_progress p LEFT JOIN users u ON u.uid = p.client_id
       GROUP BY p.client_id, u.name ORDER BY c DESC LIMIT 20`
    );
    return r.rows.map((x, i) => ({
      rank: i + 1,
      clientId: maskClient(x.cid),
      name: x.uname || `Student ${maskClient(x.cid)}`,
      completed: Number(x.c),
    }));
  },
});

/* ---------------------- map-backed stores (KV + Memory) ---------------------- */
/** For KV and Memory engines content lives in one JSON map per entity,
 *  hydrated from the bundled seed on first access — so admin CRUD works
 *  identically on every engine and the DB is the source of truth at runtime. */
const CONTENT_MAP_DEFS = {
  lessons: { seedKey: "lessons", idOf: (x) => x.id, sort: (a, b) => (a.number ?? 0) - (b.number ?? 0) },
  videos: { seedKey: "videos", idOf: (x) => x.id, sort: (a, b) => String(a.id).localeCompare(String(b.id)) },
  niches: { seedKey: "niches", idOf: (x) => x.id, sort: (a, b) => String(a.id).localeCompare(String(b.id)) },
  founders: { seedKey: "founders", idOf: (x) => x.id, sort: (a, b) => String(a.id).localeCompare(String(b.id)) },
  posts: { seedKey: "posts", idOf: (x) => x.slug, sort: (a, b) => String(b.date).localeCompare(String(a.date)) },
  modules: { seedKey: "modules", idOf: (x) => x.id, sort: (a, b) => (a.number ?? 0) - (b.number ?? 0) },
  testimonials: { seedKey: "testimonials", idOf: (_x, i) => String(i + 1), sort: () => 0 },
  users: { seedKey: null, idOf: (x) => x.uid, sort: (a, b) => String(b.last_seen || "").localeCompare(String(a.last_seen || "")) },
  certificates: { seedKey: null, idOf: (x) => x.id, sort: (a, b) => String(b.claimed_at || "").localeCompare(String(a.claimed_at || "")) },
  certificate_payments: { seedKey: null, idOf: (x) => x.id, sort: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")) },
};

/**
 * Build the full uniform admin method set for a map-backed engine.
 * readMap/writeMap persist a JSON object per entity; dyn adapters expose the
 * engine's dynamic lists (messages / subscribers / investors / comments / progress).
 */
function mapBackedMethods(readMap, writeMap, dyn) {
  async function seedMapFor(entity) {
    const def = CONTENT_MAP_DEFS[entity];
    const map = {};
    if (def?.seedKey) seed[def.seedKey].forEach((item, i) => { map[def.idOf(item, i)] = item; });
    return map;
  }
  const read = async (store, entity) => {
    let map = await readMap.call(store, entity);
    if (!map) {
      map = await seedMapFor(entity);
      await writeMap.call(store, entity, map);
    }
    return map;
  };
  const list = async (store, entity) => {
    const def = CONTENT_MAP_DEFS[entity];
    const arr = Object.values(await read(store, entity));
    return def ? arr.sort(def.sort) : arr;
  };
  const upsert = (entity, idField) =>
    async function (obj) {
      const id = obj?.[idField];
      if (!id) throw new Error(`${entity} requires "${idField}"`);
      const map = await read(this, entity);
      map[id] = obj;
      await writeMap.call(this, entity, map);
      return obj;
    };
  const del = (entity) =>
    async function (id) {
      const map = await read(this, entity);
      const existed = id in map;
      delete map[id];
      await writeMap.call(this, entity, map);
      return existed;
    };

  const m = {
    /* content readers */
    async listLessons() { return list(this, "lessons"); },
    async getLesson(id) { return (await read(this, "lessons"))[id]; },
    async listVideos() { return list(this, "videos"); },
    async getVideo(id) { return (await read(this, "videos"))[id]; },
    async listNiches() { return list(this, "niches"); },
    async getNiche(id) { return (await read(this, "niches"))[id]; },
    async listFounders() { return list(this, "founders"); },
    async getFounder(id) { return (await read(this, "founders"))[id]; },
    async listPosts() { return list(this, "posts"); },
    async getPost(slug) { return (await read(this, "posts"))[slug]; },
    async listModules() {
      const lessons = await read(this, "lessons");
      return (await list(this, "modules")).map((mod) => ({
        ...mod,
        lessonCount: Object.values(lessons).filter((l) => l.moduleId === mod.id).length,
      }));
    },
    async getModule(id) { return (await read(this, "modules"))[id]; },
    async search(q) {
      const needle = String(q).toLowerCase();
      const hit = (s) => String(s || "").toLowerCase().includes(needle);
      return {
        lessons: (await m.listLessons.call(this)).filter((l) => hit(l.title) || hit(l.subtitle) || hit(l.summary)),
        videos: (await m.listVideos.call(this)).filter((v) => hit(v.title) || hit(v.description) || hit(v.channel)),
        niches: (await m.listNiches.call(this)).filter((n) => hit(n.title) || hit(n.description)),
        founders: (await m.listFounders.call(this)).filter((f) => hit(f.name) || hit(f.bio) || hit(f.role)),
        posts: (await m.listPosts.call(this)).filter((p) => hit(p.title) || hit(p.excerpt) || (p.tags || []).some(hit)),
      };
    },
    /* content CRUD */
    upsertLesson: upsert("lessons", "id"),
    deleteLesson: del("lessons"),
    upsertVideo: upsert("videos", "id"),
    deleteVideo: del("videos"),
    upsertNiche: upsert("niches", "id"),
    deleteNiche: del("niches"),
    upsertFounder: upsert("founders", "id"),
    deleteFounder: del("founders"),
    upsertPost: upsert("posts", "slug"),
    deletePost: del("posts"),
    upsertModule: upsert("modules", "id"),
    deleteModule: del("modules"),
    /* users */
    async upsertUser(u) {
      const users = await read(this, "users");
      const now = nowIso();
      const prev = users[u.uid] || {};
      users[u.uid] = {
        uid: u.uid,
        email: u.email ?? prev.email ?? "",
        name: u.name ?? prev.name ?? "",
        photoUrl: u.photoUrl ?? prev.photoUrl ?? "",
        role: u.role || prev.role || "student",
        created_at: prev.created_at || now,
        last_seen: now,
      };
      await writeMap.call(this, "users", users);
      return users[u.uid];
    },
    async getUser(uid) { return (await read(this, "users"))[uid]; },
    async listUsers() {
      return Object.values(await read(this, "users")).sort(CONTENT_MAP_DEFS.users.sort);
    },
    async setUserRole(uid, role) {
      const users = await read(this, "users");
      const prev = users[uid] || { uid, email: "", name: "", photoUrl: "", created_at: nowIso() };
      users[uid] = { ...prev, role: role === "admin" ? "admin" : "student", last_seen: prev.last_seen || nowIso() };
      await writeMap.call(this, "users", users);
      return users[uid];
    },
    async deleteUser(uid) {
      const users = await read(this, "users");
      delete users[uid];
      await writeMap.call(this, "users", users);
    },
    /* restore bundled content */
    async reseed() {
      for (const entity of Object.keys(CONTENT_MAP_DEFS)) {
        if (entity === "users") continue;
        await writeMap.call(this, entity, await seedMapFor(entity));
      }
      return true;
    },
    /* named leaderboard */
    async leaderboard() {
      const progress = await dyn.progressGet.call(this);
      const users = await read(this, "users");
      return Object.entries(progress)
        .map(([cid, ids]) => ({
          clientId: maskClient(cid),
          name: users[cid]?.name || `Student ${maskClient(cid)}`,
          completed: (ids || []).length,
        }))
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 20)
        .map((e, i) => ({ rank: i + 1, ...e }));
    },
    /* generic admin table browsing */
    async dumpTable(table) {
      switch (table) {
        case "contact_messages": return (await dyn.listGet.call(this, "messages")).slice(-300).reverse();
        case "subscribers": return (await dyn.listGet.call(this, "subscribers")).slice(-300).reverse();
        case "investor_inquiries": return (await dyn.listGet.call(this, "investors")).slice(-300).reverse();
        case "comments": return (await dyn.commentsAll.call(this)).slice(0, 300);
        case "lesson_progress": {
          const map = await dyn.progressGet.call(this);
          const rows = [];
          for (const [cid, ids] of Object.entries(map))
            for (const lid of ids || []) rows.push({ id: `${cid}:${lid}`, client_id: cid, lesson_id: lid, completed_at: "-" });
          return rows.slice(-300).reverse();
        }
        case "users": return m.listUsers.call(this);
        case "founders": return m.listFounders.call(this);
        case "lessons": return m.listLessons.call(this);
        case "videos": return m.listVideos.call(this);
        case "niches": return m.listNiches.call(this);
        case "posts": return m.listPosts.call(this);
        case "modules": return m.listModules.call(this);
        case "testimonials": return Object.values(await read(this, "testimonials"));
        case "certificates": return Object.values(await read(this, "certificates"));
        case "certificate_payments": return Object.values(await read(this, "certificate_payments"));
        default: throw new Error(`Unknown table: ${table}`);
      }
    },
    async deleteRecord(table, key) {
      switch (table) {
        case "contact_messages": return dyn.listDelete.call(this, "messages", key);
        case "subscribers": return dyn.listDelete.call(this, "subscribers", key);
        case "investor_inquiries": return dyn.listDelete.call(this, "investors", key);
        case "comments": return dyn.commentDelete.call(this, key);
        case "lesson_progress": {
          const [cid, lid] = String(key).split(":");
          const map = await dyn.progressGet.call(this);
          if (!map[cid]) return false;
          map[cid] = (map[cid] || []).filter((x) => x !== lid);
          await dyn.progressSet.call(this, map);
          return true;
        }
        case "users": await m.deleteUser.call(this, key); return true;
        case "founders": return m.deleteFounder.call(this, key);
        case "lessons": return m.deleteLesson.call(this, key);
        case "videos": return m.deleteVideo.call(this, key);
        case "niches": return m.deleteNiche.call(this, key);
        case "posts": return m.deletePost.call(this, key);
        case "modules": return m.deleteModule.call(this, key);
        case "certificates": {
          const map = await read(this, "certificates");
          const existed = String(key) in map;
          delete map[String(key)];
          await writeMap.call(this, "certificates", map);
          return existed;
        }
        case "certificate_payments": {
          const map = await read(this, "certificate_payments");
          const existed = String(key) in map;
          delete map[String(key)];
          await writeMap.call(this, "certificate_payments", map);
          return existed;
        }
        case "testimonials": {
          const map = await read(this, "testimonials");
          const existed = String(key) in map;
          delete map[String(key)];
          await writeMap.call(this, "testimonials", map);
          return existed;
        }
        default: throw new Error(`Unknown table: ${table}`);
      }
    },
    async adminTables() {
      const rows = [];
      for (const name of ADMIN_TABLES) {
        try {
          rows.push({ name, count: (await m.dumpTable.call(this, name)).length });
        } catch {
          rows.push({ name, count: 0 });
        }
      }
      return rows;
    },
  };
  return m;
}

/* ------------------------------ KV maps ------------------------------ */
const KV_CONTENT_PREFIX = "bb:content:";
Object.assign(
  KvStore.prototype,
  mapBackedMethods(
    async function (entity) {
      return JSON.parse((await this._get(`${KV_CONTENT_PREFIX}${entity}`)) || "null");
    },
    async function (entity, map) {
      await this._set(`${KV_CONTENT_PREFIX}${entity}`, map);
    },
    {
      listGet: async function (name) {
        const key = name === "messages" ? "bb:messages" : name === "subscribers" ? "bb:subscribers" : "bb:investors";
        return JSON.parse((await this._get(key)) || "[]");
      },
      listDelete: async function (name, key) {
        const kvKey = name === "messages" ? "bb:messages" : name === "subscribers" ? "bb:subscribers" : "bb:investors";
        const listR = JSON.parse((await this._get(kvKey)) || "[]");
        const next = listR.filter((x) => String(x.id) !== String(key));
        await this._set(kvKey, next);
        return next.length !== listR.length;
      },
      progressGet: async function () {
        return JSON.parse((await this._get("bb:progress")) || "{}");
      },
      progressSet: async function (map) {
        await this._set("bb:progress", map);
      },
      commentsAll: async function () {
        const lessons = await this.listLessons();
        const all = [];
        for (const l of lessons) {
          const listR = JSON.parse((await this._get(`bb:comments:${l.id}`)) || "[]");
          for (const c of listR) all.push(c);
        }
        return all.sort((a, b) => (b.id || 0) - (a.id || 0));
      },
      commentDelete: async function (key) {
        const lessons = await this.listLessons();
        for (const l of lessons) {
          const listR = JSON.parse((await this._get(`bb:comments:${l.id}`)) || "[]");
          const next = listR.filter((c) => String(c.id) !== String(key));
          if (next.length !== listR.length) {
            await this._set(`bb:comments:${l.id}`, next);
            return true;
          }
        }
        return false;
      },
    }
  )
);

/* ------------------------------ Memory maps ------------------------------ */
Object.assign(
  MemoryStore.prototype,
  mapBackedMethods(
    async function (entity) {
      if (!this._maps) this._maps = {};
      return this._maps[entity] || null;
    },
    async function (entity, map) {
      if (!this._maps) this._maps = {};
      this._maps[entity] = map;
    },
    {
      listGet: async function (name) {
        return name === "messages" ? this.messages : name === "subscribers" ? this.subscribers : this.investorInquiries;
      },
      listDelete: async function (name, key) {
        const arr = name === "messages" ? this.messages : name === "subscribers" ? this.subscribers : this.investorInquiries;
        const next = arr.filter((x) => String(x.id) !== String(key));
        if (name === "messages") this.messages = next;
        else if (name === "subscribers") this.subscribers = next;
        else this.investorInquiries = next;
        return next.length !== arr.length;
      },
      progressGet: async function () {
        return this.progress;
      },
      progressSet: async function (map) {
        this.progress = map;
      },
      commentsAll: async function () {
        return [...this.comments].sort((a, b) => (b.id || 0) - (a.id || 0));
      },
      commentDelete: async function (key) {
        const next = this.comments.filter((c) => String(c.id) !== String(key));
        const removed = next.length !== this.comments.length;
        this.comments = next;
        return removed;
      },
    }
  )
);

/* ============================== selection ============================== */

let store;

export async function getStore() {
  if (store) return store;
  const env = process.env;

  if (env.DATABASE_URL) {
    store = new PgStore(env.DATABASE_URL);
    await store.init();
    console.log("[storage] using Postgres");
  } else if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    store = new KvStore(env.KV_REST_API_URL, env.KV_REST_API_TOKEN);
    console.log("[storage] using Vercel KV (Upstash Redis)");
  } else if (env.VERCEL === "1" || env.MEMORY === "1") {
    store = new MemoryStore();
    console.log("[storage] using in-memory store (ephemeral)");
  } else {
    const dbPath = env.DB_PATH || join(__dirname, "..", "data", "billionaire.db");
    store = new SqliteStore(dbPath);
    console.log(`[storage] using SQLite at ${dbPath}`);
  }
  return store;
}

export const storageMethods = [
  "listFounders", "getFounder", "listModules", "getModule", "listLessons", "getLesson", "listVideos", "getVideo",
  "listNiches", "getNiche", "listPosts", "getPost", "search",
  "addMessage", "listMessages", "addComment", "listComments", "leaderboard",
  "addSubscriber", "listSubscribers", "addInvestorInquiry", "listInvestorInquiries", "getProgress", "setProgress", "clearProgress",
  "stats", "databaseInfo",
  // admin / user management
  "upsertUser", "getUser", "listUsers", "setUserRole", "deleteUser",
  "dumpTable", "deleteRecord", "adminTables", "reseed",
  "upsertLesson", "deleteLesson", "upsertVideo", "deleteVideo", "upsertNiche", "deleteNiche",
  "upsertFounder", "deleteFounder", "upsertPost", "deletePost", "upsertModule", "deleteModule",
];
