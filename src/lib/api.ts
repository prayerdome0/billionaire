// Lightweight API client for the Seedwel / Billionaire Blueprint REST API.
// Authenticated calls automatically attach the Firebase ID token registered by
// the AuthProvider (setAuthTokenProvider) — no API keys live in this file.

import {
  founders as fallbackFounders,
  lessons as fallbackLessons,
  modules as fallbackModules,
  niches as fallbackNiches,
  successStories as fallbackStories,
  videos as fallbackVideos,
  type Founder,
  type Lesson,
  type Module,
  type Niche,
  type SiteConfig,
  type SuccessStory,
  type Video,
} from "../data/content";

export type { Founder, Lesson, Module, Niche, SiteConfig, SuccessStory, Video };

export interface ApiStats {
  founders: number;
  lessons: number;
  modules: number;
  videos: number;
  niches: number;
  testimonials: number;
  contactMessages: number;
  completedLessons: number;
  totalProgress: number;
  posts?: number;
  comments?: number;
  subscribers?: number;
  users?: number;
  database: Record<string, number>;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface Comment {
  id: number;
  lessonId: string;
  clientId: string;
  name: string;
  text: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  clientId: string;
  name?: string;
  completed: number;
}

export interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export interface InvestorInquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  interest_area: string;
  amount_range?: string;
  message?: string;
  created_at: string;
}

export interface RegisteredUser {
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  role: "admin" | "student";
  created_at?: string;
  last_seen?: string;
}

export interface AuthMe {
  user: RegisteredUser;
  isAdmin: boolean;
  adminEmails?: string[];
}

export interface AdminOverview {
  company: {
    name: string;
    registeredYear: number;
    status: string;
    founder: string;
    countryDirectorZambia: string;
    adminEmail: string;
    pillars: string[];
  };
  stats: Record<string, number>;
  database: Record<string, unknown>;
  messages: ContactMessage[];
  subscribers: Subscriber[];
  investorInquiries: InvestorInquiry[];
  users?: RegisteredUser[];
}

export interface UpgradeRecommendation {
  id: string;
  category: string;
  title: string;
  priority: "High" | "Medium" | "Strategic";
  actionType: "Upgrade" | "Add";
  description: string;
  impact: string;
  status: string;
}

export interface AdminTableInfo {
  name: string;
  count: number;
}

export interface AdminDatabaseInfo {
  engine: string;
  file?: string;
  firebaseProject?: string;
  tables: AdminTableInfo[];
}

export type ContentResource = "lessons" | "videos" | "niches" | "founders" | "posts" | "modules";

const API_BASE = "/api";

/* ---------------- token provider (registered by AuthProvider) ---------------- */
type TokenProvider = () => Promise<string | null>;
let tokenProvider: TokenProvider | null = null;
export function setAuthTokenProvider(fn: TokenProvider) {
  tokenProvider = fn;
}

async function request<T>(path: string, init?: RequestInit, opts?: { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.auth && tokenProvider) {
    const token = await tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      message = `${message}: ${await res.text().catch(() => "")}`.trim();
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

/* ------------------------------ public content ------------------------------ */
/* Now tries Firestore TRUE DATABASE first, then API, then bundled fallback */

import {
  fetchLessonsFromFirestore,
  fetchModulesFromFirestore,
  fetchFoundersFromFirestore,
  getProgressFirestore,
  setProgressFirestore,
  leaderboardFromFirestore,
  listAllUsersFirestore,
  getCertificateStatus,
} from "./firestoreDb";
import { auth } from "./firebase";

export async function getApiStats(): Promise<ApiStats> {
  try {
    return await request<ApiStats>("/stats");
  } catch {
    return {
      founders: fallbackFounders.length,
      lessons: fallbackLessons.length,
      modules: fallbackModules.length,
      videos: fallbackVideos.length,
      niches: fallbackNiches.length,
      testimonials: 3,
      contactMessages: 0,
      completedLessons: 0,
      totalProgress: 0,
      database: { firestore: 1, fallback: 1 },
    };
  }
}

export async function fetchFounders(): Promise<Founder[]> {
  try {
    const fs = await fetchFoundersFromFirestore();
    if (fs && fs.length) return fs as Founder[];
  } catch {}
  try {
    return await request<Founder[]>("/founders");
  } catch {
    return fallbackFounders;
  }
}

export async function fetchModules(): Promise<Module[]> {
  try {
    const fs = await fetchModulesFromFirestore();
    if (fs && fs.length) return fs as any;
  } catch {}
  try {
    return await request<Module[]>("/modules");
  } catch {
    return fallbackModules;
  }
}

export async function fetchLessons(): Promise<Lesson[]> {
  try {
    const fs = await fetchLessonsFromFirestore();
    if (fs && fs.length) return fs as Lesson[];
  } catch {}
  try {
    return await request<Lesson[]>("/lessons");
  } catch {
    return fallbackLessons;
  }
}

export async function fetchLesson(id: string): Promise<Lesson> {
  // try Firestore first via lessons list (cheaper than direct doc for fallback)
  try {
    const all = await fetchLessonsFromFirestore();
    const found = (all as Lesson[]).find((l) => l.id === id);
    if (found) return found;
  } catch {}
  try {
    return await request<Lesson>(`/lessons/${id}`);
  } catch {
    const lesson = fallbackLessons.find((l) => l.id === id);
    if (!lesson) throw new Error("Lesson not found");
    return lesson;
  }
}

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    const snap = await getDocs(collection(db, "videos"));
    if (!snap.empty) return snap.docs.map((d) => d.data() as Video);
  } catch {}
  try {
    return await request<Video[]>("/videos");
  } catch {
    return fallbackVideos;
  }
}

/* ------------------------------ success stories (successful people + their videos) ------------------------------ */

export async function fetchSuccessStories(): Promise<SuccessStory[]> {
  try {
    return await request<SuccessStory[]>("/success-stories");
  } catch {
    return fallbackStories;
  }
}

export async function fetchSuccessStory(id: string): Promise<SuccessStory> {
  try {
    return await request<SuccessStory>(`/success-stories/${encodeURIComponent(id)}`);
  } catch {
    const story = fallbackStories.find((s) => s.id === id);
    if (!story) throw new Error("Success story not found");
    return story;
  }
}

export interface VideoWithStats extends Video {
  views?: number;
  kind?: string;
  person?: string;
  introAudio?: string | null;
  outroAudio?: string | null;
}

export async function fetchVideo(id: string): Promise<VideoWithStats> {
  return request<VideoWithStats>(`/videos/${encodeURIComponent(id)}`);
}

export async function fetchRelatedVideos(id: string): Promise<VideoWithStats[]> {
  try {
    return await request<VideoWithStats[]>(`/videos/${encodeURIComponent(id)}/related`);
  } catch {
    return [];
  }
}

export interface VideoStatsResponse {
  totalViews: number;
  topVideos: { id: string; title: string; youtubeId: string; person?: string; views: number }[];
  all: { id: string; title: string; youtubeId: string; person?: string; views: number }[];
}

export async function fetchVideoStats(): Promise<VideoStatsResponse> {
  return request<VideoStatsResponse>("/videos/stats");
}

export async function postVideoView(videoId: string): Promise<{ ok: boolean; id: string; views: number }> {
  try {
    return await request<{ ok: boolean; id: string; views: number }>(`/videos/${encodeURIComponent(videoId)}/view`, { method: "POST" });
  } catch {
    return { ok: true, id: videoId, views: 0 };
  }
}

export interface QuoteOfDay {
  date: string;
  quote: string;
  author: string;
  country: string;
  title: string;
  photo: string;
  encouragement: string;
  video: { id: string; youtubeId: string; title: string; channel: string; duration: string } | null;
  random: { quote: string; author: string; video: { id: string; youtubeId: string; title: string } | null };
}

export async function fetchQuoteOfTheDay(): Promise<QuoteOfDay | null> {
  try {
    return await request<QuoteOfDay>("/quote");
  } catch {
    const story = fallbackStories[new Date().getDate() % fallbackStories.length];
    if (!story) return null;
    return {
      date: new Date().toISOString().slice(0, 10),
      quote: story.quote,
      author: story.name,
      country: story.country,
      title: story.title,
      photo: story.photo,
      encouragement: story.encouragement,
      video: story.video ? { id: `story-${story.id}`, ...story.video } : null,
      random: { quote: story.quote, author: story.name, video: null },
    };
  }
}

export interface SiteConfigResponse extends SiteConfig {
  siteStats?: { label: string; value: string }[];
  heroImage?: string;
  videoCount?: number;
  successStoryCount?: number;
  lessonCount?: number;
  moduleCount?: number;
  founderCount?: number;
  tuitionModel?: string;
  certificateFeeUsd?: number;
  incorporationNote?: string;
}

export async function fetchSiteConfig(): Promise<SiteConfigResponse | null> {
  try {
    return await request<SiteConfigResponse>("/site");
  } catch {
    return null;
  }
}

/* ------------------------------ feedback + watch history + features ------------------------------ */

export interface Feedback {
  id: string;
  name: string;
  email: string;
  page: string;
  rating: number;
  comment: string;
  created_at: string;
}

export async function postFeedback(input: { name?: string; email?: string; page?: string; rating?: number; comment?: string }): Promise<{ success: boolean; feedback: Feedback; message: string }> {
  return request<{ success: boolean; feedback: Feedback; message: string }>("/feedback", { method: "POST", body: JSON.stringify(input) });
}

export async function fetchFeedback(): Promise<Feedback[]> {
  return request<Feedback[]>("/feedback", undefined, { auth: true });
}

export interface WatchHistoryEntry {
  videoId: string;
  videoTitle: string;
  watchedAt: string;
}

export async function fetchWatchHistory(): Promise<WatchHistoryEntry[]> {
  try {
    const res = await request<{ history: WatchHistoryEntry[] }>("/watch-history", undefined, { auth: true });
    return res.history;
  } catch {
    return [];
  }
}

export async function postWatchHistory(videoId: string, videoTitle: string): Promise<void> {
  try {
    await request("/watch-history", { method: "POST", body: JSON.stringify({ videoId, videoTitle }) }, { auth: true });
  } catch {
    /* guests fall back to localStorage */
  }
}

export interface FeaturesResponse {
  service: string;
  version: string;
  trueDatabase: string;
  tuitionModel: string;
  certificateFeeUsd: number;
  content: Record<string, number>;
  engagement: { videoViews: Record<string, number>; totalViews: number; feedbackCount: number; watchHistoryEntries: number };
  endpoints: { method: string; path: string }[];
}

export async function fetchFeatures(): Promise<FeaturesResponse | null> {
  try {
    return await request<FeaturesResponse>("/features");
  } catch {
    return null;
  }
}

export async function fetchNiches(): Promise<Niche[]> {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const { db } = await import("./firebase");
    const snap = await getDocs(collection(db, "niches"));
    if (!snap.empty) return snap.docs.map((d) => d.data() as Niche);
  } catch {}
  try {
    return await request<Niche[]>("/niches");
  } catch {
    return fallbackNiches;
  }
}

export async function postContact(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  return request<ContactMessage>("/contact", { method: "POST", body: JSON.stringify(input) });
}

export async function fetchComments(lessonId: string): Promise<Comment[]> {
  try {
    return await request<Comment[]>(`/comments?lessonId=${encodeURIComponent(lessonId)}`);
  } catch {
    return [];
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // Try Firestore true DB first
  try {
    const fsBoard = await leaderboardFromFirestore();
    if (fsBoard && fsBoard.length) {
      return fsBoard.map((e) => ({ rank: e.rank, clientId: e.clientId, name: e.name, completed: e.completed }));
    }
  } catch {}
  try {
    return await request<LeaderboardEntry[]>("/leaderboard");
  } catch {
    return [];
  }
}

export async function subscribeNewsletter(email: string): Promise<Subscriber> {
  return request<Subscriber>("/newsletter", { method: "POST", body: JSON.stringify({ email }) });
}

export async function postInvestorInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  interestArea: string;
  amountRange?: string;
  message?: string;
}): Promise<{ success: boolean; inquiry: InvestorInquiry }> {
  return request("/investors", { method: "POST", body: JSON.stringify(input) });
}

/* ------------------------------ authentication ------------------------------ */

/** Sync the signed-in user with the database; returns profile + admin flag. */
export async function syncAuthMe(): Promise<AuthMe> {
  return request<AuthMe>("/auth/me", { method: "POST" }, { auth: true });
}

/** Legacy development admin login (server refuses it in production). */
export async function adminLogin(email: string, password: string): Promise<{
  success: boolean;
  token: string;
  admin: { name: string; role: string; email: string };
}> {
  return request("/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

/* ------------------------------ student (signed in) — TRUE DB: Firestore first ------------------------------ */

export async function fetchProgress(): Promise<string[]> {
  // Firestore is true database — try it first if signed in
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const ids = await getProgressFirestore(uid);
      if (ids) return ids;
    }
  } catch {}
  try {
    const data = await request<{ lessonIds: string[] }>("/progress", undefined, { auth: true });
    return data.lessonIds;
  } catch {
    return [];
  }
}

export async function markLessonComplete(lessonId: string, complete: boolean): Promise<void> {
  // Write to Firestore true DB + API (dual write for compatibility)
  try {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await setProgressFirestore(uid, lessonId, complete);
    }
  } catch {}
  try {
    await request(
      "/progress",
      { method: complete ? "POST" : "DELETE", body: JSON.stringify({ lessonId }) },
      { auth: true }
    );
  } catch {
    // Firestore already succeeded — API offline is okay
  }
}

// Certificate paid status helpers (Firestore true DB)
export async function fetchMyCertificate() {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  return getCertificateStatus(uid);
}

export async function fetchFirestoreUsers() {
  try {
    return await listAllUsersFirestore();
  } catch {
    return [];
  }
}

export async function postComment(input: { lessonId: string; name?: string; text: string }): Promise<Comment> {
  return request<Comment>("/comments", { method: "POST", body: JSON.stringify(input) }, { auth: true });
}

/* ------------------------------ admin (management only) ------------------------------ */

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return request<AdminOverview>("/admin/overview", undefined, { auth: true });
}

export async function fetchAdminRecommendations(): Promise<{
  summary: string;
  company: string;
  recommendations: UpgradeRecommendation[];
}> {
  return request("/admin/recommendations", undefined, { auth: true });
}

export async function fetchAdminUsers(): Promise<RegisteredUser[]> {
  return request<RegisteredUser[]>("/admin/users", undefined, { auth: true });
}

export async function setAdminUserRole(uid: string, role: "admin" | "student"): Promise<RegisteredUser> {
  return request<RegisteredUser>(
    `/admin/users/${encodeURIComponent(uid)}`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    { auth: true }
  );
}

export async function deleteAdminUser(uid: string): Promise<void> {
  await request(`/admin/users/${encodeURIComponent(uid)}`, { method: "DELETE" }, { auth: true });
}

export async function fetchAdminDatabase(): Promise<AdminDatabaseInfo> {
  return request<AdminDatabaseInfo>("/admin/database", undefined, { auth: true });
}

export async function fetchAdminTable(table: string): Promise<Record<string, unknown>[]> {
  const data = await request<{ table: string; rows: Record<string, unknown>[] }>(
    `/admin/database/${encodeURIComponent(table)}`,
    undefined,
    { auth: true }
  );
  return data.rows;
}

export async function deleteAdminRecord(table: string, key: string | number): Promise<void> {
  await request(`/admin/database/${encodeURIComponent(table)}/${encodeURIComponent(String(key))}`, { method: "DELETE" }, { auth: true });
}

export async function reseedContent(): Promise<{ ok: boolean; message: string }> {
  return request("/admin/reseed", { method: "POST", body: JSON.stringify({}) }, { auth: true });
}

export async function fetchAdminContent<T = unknown>(resource: ContentResource): Promise<T[]> {
  return request<T[]>(`/admin/content/${resource}`, undefined, { auth: true });
}

export async function createAdminContent<T = unknown>(resource: ContentResource, body: unknown): Promise<T> {
  return request<T>(`/admin/content/${resource}`, { method: "POST", body: JSON.stringify(body) }, { auth: true });
}

export async function updateAdminContent<T = unknown>(resource: ContentResource, id: string, body: unknown): Promise<T> {
  return request<T>(`/admin/content/${resource}/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) }, { auth: true });
}

export async function deleteAdminContent(resource: ContentResource, id: string): Promise<void> {
  await request(`/admin/content/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" }, { auth: true });
}

/** Full list of endpoints, used by the API docs page. `access` marks the tier. */
export const API_ENDPOINTS: {
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  path: string;
  description: string;
  example: string;
  access: "public" | "student" | "admin";
}[] = [
  { method: "GET", path: "/api/health", description: "Liveness check, storage engine + Firebase project.", example: '{"status":"ok","db":"sqlite","firebaseProject":"seedwel-cbeb8"}', access: "public" },
  { method: "GET", path: "/api/stats", description: "Aggregate counts across the database and content.", example: '{"founders":6,"lessons":28,"videos":7,"users":12}', access: "public" },
  { method: "GET", path: "/api/founders", description: "List all founders (photos, bios, quotes).", example: '[{"id":"seedwell-masuku","name":"Mr. Seedwell Khayalethu Masuku",...}]', access: "public" },
  { method: "GET", path: "/api/founders/:id", description: "Fetch a single founder by id.", example: '{"id":"zacheus-simbaya","name":"Zacheus Simbaya",...}', access: "public" },
  { method: "GET", path: "/api/modules", description: "List the six curriculum modules.", example: '[{"id":"m1","title":"The Billionaire Mindset",...}]', access: "public" },
  { method: "GET", path: "/api/lessons", description: "List all lessons (full content included).", example: '[{"id":"l01-psychology-of-wealth","title":"The Psychology of Wealth",...}]', access: "public" },
  { method: "GET", path: "/api/lessons/:id", description: "Fetch one lesson with content, takeaways, and quiz.", example: '{"id":"l07-compounding","title":"The Eighth Wonder",...}', access: "public" },
  { method: "GET", path: "/api/videos", description: "List video masterclasses with YouTube IDs.", example: '[{"id":"vid-economic-machine","youtubeId":"PHe0bXAIuk0",...}]', access: "public" },
  { method: "GET", path: "/api/success-stories", description: "All 13 successful people with photos, quotes, and their real YouTube videos (branded intro/outro).", example: '[{"id":"aliko-dangote","name":"Aliko Dangote","video":{"youtubeId":"AYaEw-kxGdY",...}}]', access: "public" },
  { method: "GET", path: "/api/success-stories/:id", description: "One successful person with their video + view count.", example: '{"id":"oprah-winfrey","video":{"youtubeId":"soWqiVSVNFY",...},"views":12}', access: "public" },
  { method: "GET", path: "/api/videos/stats", description: "Total video views + most-watched videos (masterclasses & success stories).", example: '{"totalViews":42,"topVideos":[{"id":"vid-...","views":10}]}', access: "public" },
  { method: "GET", path: "/api/videos/:id", description: "One video by id (masterclass or story-<person>).", example: '{"id":"story-aliko-dangote","youtubeId":"AYaEw-kxGdY",...}', access: "public" },
  { method: "GET", path: "/api/videos/:id/related", description: "Suggested next videos for any video id.", example: '[{"id":"vid-grit-duckworth",...},...]', access: "public" },
  { method: "POST", path: "/api/videos/:id/view", description: "Count a video view (fires when playback starts).", example: 'POST /api/videos/vid-economic-machine/view → {"views":3}', access: "public" },
  { method: "GET", path: "/api/quote", description: "Quote of the day from a successful person + random pick + their video.", example: '{"date":"2026-08-08","quote":"...","author":"Aliko Dangote","video":{...}}', access: "public" },
  { method: "GET", path: "/api/site", description: "Site config incl. the branded video intro/outro templates.", example: '{"name":"Seedwel Investment Limited","videoIntroTemplate":"Welcome to Seedwel Investment Limited, here is",...}', access: "public" },
  { method: "POST", path: "/api/feedback", description: "Submit site feedback / video rating (1-5 stars + comment).", example: 'POST body {"page":"/videos","rating":5,"comment":"Loved it!"}', access: "public" },
  { method: "GET", path: "/api/features", description: "Self-documenting index of every API endpoint + live engagement stats.", example: '{"service":"...","endpoints":[{"method":"GET","path":"/api/health"},...]}', access: "public" },
  { method: "GET", path: "/api/feedback", description: "List all feedback entries (admin only).", example: '[{"id":"...","rating":5,"comment":"Loved it!","page":"/videos"}]', access: "admin" },
  { method: "GET", path: "/api/watch-history", description: "Your recent watch history (signed-in students).", example: 'Authorization: Bearer <idToken> → {"history":[{"videoId":"vid-...","watchedAt":"..."}]}', access: "student" },
  { method: "POST", path: "/api/watch-history", description: "Record a video you watched.", example: 'POST body {"videoId":"story-oprah-winfrey","videoTitle":"..."}', access: "student" },
  { method: "GET", path: "/api/niches", description: "List the high-paying niches and billionaire case studies.", example: '[{"id":"tech-ai","title":"AI & Technology",...}]', access: "public" },
  { method: "GET", path: "/api/niches/:id", description: "Fetch a single niche by id.", example: '{"id":"real-estate","title":"Real Estate",...}', access: "public" },
  { method: "GET", path: "/api/posts", description: "List blog posts from the database.", example: '[{"slug":"five-numbers-every-investor-must-know",...}]', access: "public" },
  { method: "GET", path: "/api/posts/:slug", description: "Fetch a single blog post by slug.", example: '{"slug":"ai-wont-replace-you","title":"AI Won\'t Replace You",...}', access: "public" },
  { method: "GET", path: "/api/search?q=...", description: "Search across lessons, videos, niches, founders, and posts.", example: '{"lessons":[...],"videos":[...],"posts":[...]}', access: "public" },
  { method: "GET", path: "/api/leaderboard", description: "Top students by completed lessons (names when registered).", example: '[{"rank":1,"name":"Ada","completed":12}]', access: "public" },
  { method: "GET", path: "/api/comments?lessonId=...", description: "List comments for a lesson.", example: '[{"id":1,"name":"Ada","text":"Great lesson!",...}]', access: "public" },
  { method: "POST", path: "/api/contact", description: "Submit a contact message (stored in the database).", example: 'POST body {"name":"Ada","email":"ada@x.io","subject":"Mentorship","message":"..."}', access: "public" },
  { method: "POST", path: "/api/newsletter", description: "Subscribe an email to the newsletter (database write).", example: 'POST body {"email":"ada@example.com"}', access: "public" },
  { method: "POST", path: "/api/investors", description: "Submit an investor inquiry for School Building or AI Business (database write).", example: 'POST body {"name":"Investor","email":"i@fund.org","interestArea":"School Building"}', access: "public" },
  { method: "POST", path: "/api/auth/me", description: "Sync the signed-in Firebase user; returns profile + admin flag.", example: 'Authorization: Bearer <idToken> → {"user":{...},"isAdmin":false}', access: "student" },
  { method: "GET", path: "/api/progress", description: "Your completed lesson ids (account-bound).", example: 'Authorization: Bearer <idToken> → {"lessonIds":["l01-..."]}', access: "student" },
  { method: "POST", path: "/api/progress", description: "Mark a lesson complete on your account.", example: 'POST body {"lessonId":"l02-asymmetric-bets"}', access: "student" },
  { method: "DELETE", path: "/api/progress", description: "Unmark a lesson complete on your account.", example: 'DELETE body {"lessonId":"l02-asymmetric-bets"}', access: "student" },
  { method: "POST", path: "/api/comments", description: "Comment on a lesson as your registered account.", example: 'POST body {"lessonId":"l01-...","text":"Great lesson!"}', access: "student" },
  { method: "GET", path: "/api/admin/overview", description: "Full management overview, company registration status, deal flow, users.", example: '{"company":{"name":"Seedwel Investment Limited",...},"stats":{...}}', access: "admin" },
  { method: "GET", path: "/api/admin/recommendations", description: "Management advisory: what to upgrade or add across all company pillars.", example: '{"recommendations":[{"id":"rec-school-escrow",...}]}', access: "admin" },
  { method: "GET", path: "/api/admin/users", description: "List every registered user (students & admins).", example: '[{"uid":"...","email":"ada@x.io","role":"student"}]', access: "admin" },
  { method: "PATCH", path: "/api/admin/users/:uid", description: "Grant or revoke admin rights for a user.", example: 'PATCH body {"role":"admin"}', access: "admin" },
  { method: "DELETE", path: "/api/admin/users/:uid", description: "Remove a user record from the database.", example: "DELETE /api/admin/users/<uid>", access: "admin" },
  { method: "GET", path: "/api/admin/database", description: "Database engine + every table with live row counts.", example: '{"engine":"sqlite","tables":[{"name":"lessons","count":28},...]}', access: "admin" },
  { method: "GET", path: "/api/admin/database/:table", description: "Browse the rows of any table (up to 300).", example: '{"table":"subscribers","rows":[{...}]}', access: "admin" },
  { method: "DELETE", path: "/api/admin/database/:table/:key", description: "Delete any single record by primary key.", example: "DELETE /api/admin/database/subscribers/3", access: "admin" },
  { method: "POST", path: "/api/admin/reseed", description: "Restore all content tables from the bundled curriculum data.", example: '{"ok":true,"message":"Content tables restored..."}', access: "admin" },
  { method: "GET", path: "/api/admin/content/:resource", description: "List a content resource (lessons, videos, niches, founders, posts, modules).", example: "/api/admin/content/lessons", access: "admin" },
  { method: "POST", path: "/api/admin/content/:resource", description: "Create/replace a content record (body must include its id/slug).", example: 'POST body {"id":"l29-new","title":"...",...}', access: "admin" },
  { method: "PUT", path: "/api/admin/content/:resource/:id", description: "Merge-update a content record.", example: 'PUT body {"title":"Updated title"}', access: "admin" },
  { method: "DELETE", path: "/api/admin/content/:resource/:id", description: "Delete a content record.", example: "DELETE /api/admin/content/videos/vid-x", access: "admin" },
  { method: "GET", path: "/api/contact", description: "List stored contact messages (PII — admin only).", example: '[{"id":1,"name":"Ada","email":"ada@x.io",...}]', access: "admin" },
  { method: "GET", path: "/api/newsletter", description: "List newsletter subscribers (PII — admin only).", example: '[{"id":1,"email":"ada@example.com",...}]', access: "admin" },
  { method: "GET", path: "/api/investors", description: "List all investor inquiries (deal flow — admin only).", example: '[{"id":1,"name":"SADC Growth Fund",...}]', access: "admin" },
  { method: "GET", path: "/api/database", description: "Inspect the database: engine, table counts, recent rows (admin only).", example: '{"tables":{"lessons":28,"users":4},...}', access: "admin" },
];
