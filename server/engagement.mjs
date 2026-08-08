/**
 * Engagement store for Seedwel Investment Limited — video views, feedback,
 * and per-user watch history.
 *
 * Storage: in-memory Map with best-effort JSON-file persistence (data/engagement.json)
 * so local SQLite installs survive restarts. On Vercel serverless it is ephemeral
 * (same behaviour as the Memory store) — no secrets, no external service needed.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = process.env.ENGAGEMENT_FILE || join(__dirname, "..", "data", "engagement.json");

let state = { videoViews: {}, feedback: [], watchHistory: {}, subscribersSeen: 0 };

function load() {
  try {
    if (existsSync(FILE)) state = { ...state, ...JSON.parse(readFileSync(FILE, "utf8")) };
  } catch {
    /* first run — start empty */
  }
}

function persist() {
  try {
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(state));
  } catch {
    /* best-effort */
  }
}

load();

export const engagement = {
  /** Increment the view counter for a video id. Returns the new total. */
  addVideoView(videoId) {
    const id = String(videoId || "").slice(0, 200);
    state.videoViews[id] = (state.videoViews[id] || 0) + 1;
    persist();
    return state.videoViews[id];
  },

  getVideoViews(videoId) {
    return state.videoViews[String(videoId || "")] || 0;
  },

  topVideos(limit = 10) {
    return Object.entries(state.videoViews)
      .map(([id, views]) => ({ id, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },

  totalViews() {
    return Object.values(state.videoViews).reduce((a, b) => a + b, 0);
  },

  addFeedback({ name = "", email = "", page = "", rating, comment = "" }) {
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 200),
      page: String(page).slice(0, 200),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: String(comment).slice(0, 5000),
      created_at: new Date().toISOString(),
    };
    state.feedback.push(item);
    persist();
    return item;
  },

  listFeedback(limit = 200) {
    return [...state.feedback].reverse().slice(0, limit);
  },

  addWatch(uid, videoId, videoTitle = "") {
    const key = String(uid || "anonymous").slice(0, 200);
    const list = state.watchHistory[key] || [];
    list.unshift({
      videoId: String(videoId || "").slice(0, 200),
      videoTitle: String(videoTitle || "").slice(0, 300),
      watchedAt: new Date().toISOString(),
    });
    state.watchHistory[key] = list.slice(0, 50);
    persist();
    return state.watchHistory[key];
  },

  getWatchHistory(uid) {
    return (state.watchHistory[String(uid || "anonymous")] || []).slice(0, 50);
  },

  stats() {
    return {
      videoViews: state.videoViews,
      totalViews: this.totalViews(),
      feedbackCount: state.feedback.length,
      watchHistoryEntries: Object.values(state.watchHistory).reduce((a, b) => a + b.length, 0),
    };
  },
};

export default engagement;
