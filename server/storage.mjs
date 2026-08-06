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
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT, client_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
        completed_at TEXT NOT NULL, UNIQUE(client_id, lesson_id)
      );
      CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_progress_client ON lesson_progress(client_id);
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
    const tables = ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials", "contact_messages", "comments", "subscribers", "lesson_progress"];
    const out = {};
    for (const t of tables) out[t] = this._count(t);
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
      completedLessons: completed,
      totalProgress: seed.lessons.length ? Math.round((completed / seed.lessons.length) * 100) : 0,
      database: { seeded_content: "bundled json", contactMessages: dynamic.contactMessages, comments: commentCount, subscribers: dynamic.subscribers, progress: Object.keys(progress).length },
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
      CREATE TABLE IF NOT EXISTS lesson_progress (id SERIAL PRIMARY KEY, client_id TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, UNIQUE(client_id, lesson_id));
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
    const [f, mo, l, v, n, p, t, cm, co, su, pr] = await Promise.all([
      this._count("founders"), this._count("modules"), this._count("lessons"), this._count("videos"),
      this._count("niches"), this._count("posts"), this._count("testimonials"), this._count("contact_messages"),
      this._count("comments"), this._count("subscribers"), this._count("lesson_progress"),
    ]);
    return {
      founders: f, modules: mo, lessons: l, videos: v, niches: n, posts: p, testimonials: t,
      contactMessages: cm, comments: co, subscribers: su, completedLessons: pr,
      totalProgress: l ? Math.round((pr / l) * 100) : 0,
      database: { founders: f, modules: mo, lessons: l, videos: v, niches: n, posts: p, testimonials: t, contact_messages: cm, comments: co, subscribers: su, lesson_progress: pr },
    };
  }
  async databaseInfo() {
    const counts = {};
    for (const t of ["founders", "modules", "lessons", "videos", "niches", "posts", "testimonials", "contact_messages", "comments", "subscribers", "lesson_progress"]) counts[t] = await this._count(t);
    const [messages, comments, subscribers, progress] = await Promise.all([
      this._q("SELECT id, name, email, subject, created_at FROM contact_messages ORDER BY id DESC LIMIT 10"),
      this._q("SELECT id, lesson_id, name, text, created_at FROM comments ORDER BY id DESC LIMIT 10"),
      this._q("SELECT id, email, created_at FROM subscribers ORDER BY id DESC LIMIT 10"),
      this._q("SELECT client_id, lesson_id, completed_at FROM lesson_progress ORDER BY id DESC LIMIT 10"),
    ]);
    return {
      engine: this.engine,
      file: this.file,
      tables: counts,
      recentMessages: messages.rows,
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
      completedLessons: completed,
      totalProgress: seed.lessons.length ? Math.round((completed / seed.lessons.length) * 100) : 0,
      database: { contactMessages: this.messages.length, comments: this.comments.length, subscribers: this.subscribers.length, progress: Object.keys(this.progress).length },
    };
  }
  async databaseInfo() {
    const s = await this.stats();
    return {
      engine: this.engine,
      file: "in-memory (resets on redeploy)",
      tables: s.database,
      recentMessages: [...this.messages].reverse().slice(0, 10).map(({ id, name, email, subject, created_at }) => ({ id, name, email, subject, created_at })),
      recentComments: [...this.comments].reverse().slice(0, 10),
      recentSubscribers: [...this.subscribers].reverse().slice(0, 10).map(({ id, email, created_at }) => ({ id, email, created_at })),
      recentProgress: Object.entries(this.progress).flatMap(([clientId, ids]) => ids.map((lessonId) => ({ client_id: maskClient(clientId), lesson_id: lessonId, completed_at: "-" }))).slice(0, 10),
    };
  }
}

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
  "listFounders", "getFounder", "listModules", "listLessons", "getLesson", "listVideos",
  "listNiches", "getNiche", "listPosts", "getPost", "search",
  "addMessage", "listMessages", "addComment", "listComments", "leaderboard",
  "addSubscriber", "listSubscribers", "getProgress", "setProgress", "clearProgress",
  "stats", "databaseInfo",
];
