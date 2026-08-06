// Lightweight API client for the Billionaire Blueprint REST API.
// Falls back to bundled JSON data when the API is unavailable (e.g. static previews).

import {
  founders as fallbackFounders,
  lessons as fallbackLessons,
  modules as fallbackModules,
  niches as fallbackNiches,
  videos as fallbackVideos,
  type Founder,
  type Lesson,
  type Module,
  type Niche,
  type Video,
} from "../data/content";

export type { Founder, Lesson, Module, Niche, Video };

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

const API_BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

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
      database: { fallback: 1 },
    };
  }
}

export async function fetchFounders(): Promise<Founder[]> {
  try {
    return await request<Founder[]>("/founders");
  } catch {
    return fallbackFounders;
  }
}

export async function fetchModules(): Promise<Module[]> {
  try {
    return await request<Module[]>("/modules");
  } catch {
    return fallbackModules;
  }
}

export async function fetchLessons(): Promise<Lesson[]> {
  try {
    return await request<Lesson[]>("/lessons");
  } catch {
    return fallbackLessons;
  }
}

export async function fetchLesson(id: string): Promise<Lesson> {
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
    return await request<Video[]>("/videos");
  } catch {
    return fallbackVideos;
  }
}

export async function fetchNiches(): Promise<Niche[]> {
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
  return request<ContactMessage>("/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchProgress(clientId: string): Promise<string[]> {
  try {
    const data = await request<{ lessonIds: string[] }>(
      `/progress?clientId=${encodeURIComponent(clientId)}`
    );
    return data.lessonIds;
  } catch {
    return [];
  }
}

export async function markLessonComplete(
  clientId: string,
  lessonId: string,
  complete: boolean
): Promise<void> {
  await request("/progress", {
    method: complete ? "POST" : "DELETE",
    body: JSON.stringify({ clientId, lessonId }),
  });
}

export function getClientId(): string {
  const KEY = "bb_client_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

/** Full list of public endpoints, used by the API docs page. */
export const API_ENDPOINTS: {
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  example: string;
}[] = [
  {
    method: "GET",
    path: "/api/health",
    description: "Liveness check and server info.",
    example: '{"status":"ok","db":"sqlite","tables":8}',
  },
  {
    method: "GET",
    path: "/api/stats",
    description: "Aggregate counts across the database and content.",
    example: '{"founders":4,"lessons":28,"videos":7,"totalProgress":34}',
  },
  {
    method: "GET",
    path: "/api/founders",
    description: "List all founders (photos, bios, quotes).",
    example: '[{"id":"alex-morgan","name":"Alex Morgan",...}]',
  },
  {
    method: "GET",
    path: "/api/founders/:id",
    description: "Fetch a single founder by id.",
    example: '{"id":"sarah-chen","name":"Sarah Chen",...}',
  },
  {
    method: "GET",
    path: "/api/modules",
    description: "List the six curriculum modules.",
    example: '[{"id":"m1","title":"The Billionaire Mindset",...}]',
  },
  {
    method: "GET",
    path: "/api/lessons",
    description: "List all lessons (full content included).",
    example: '[{"id":"l01-psychology-of-wealth","title":"The Psychology of Wealth",...}]',
  },
  {
    method: "GET",
    path: "/api/lessons/:id",
    description: "Fetch one lesson with content, takeaways, and quiz.",
    example: '{"id":"l07-compounding","title":"The Eighth Wonder",...}',
  },
  {
    method: "GET",
    path: "/api/videos",
    description: "List video masterclasses with YouTube IDs.",
    example: '[{"id":"vid-economic-machine","youtubeId":"PHe0bXAIuk0",...}]',
  },
  {
    method: "GET",
    path: "/api/niches",
    description: "List the high-paying niches and billionaire case studies.",
    example: '[{"id":"tech-ai","title":"AI & Technology",...}]',
  },
  {
    method: "GET",
    path: "/api/progress?clientId=...",
    description: "Get completed lesson ids for a client.",
    example: '{"lessonIds":["l01-psychology-of-wealth",...]}',
  },
  {
    method: "POST",
    path: "/api/progress",
    description: "Mark a lesson complete for a client.",
    example: 'POST body {"clientId":"...","lessonId":"l02-asymmetric-bets"}',
  },
  {
    method: "DELETE",
    path: "/api/progress",
    description: "Unmark a lesson complete for a client.",
    example: 'DELETE body {"clientId":"...","lessonId":"l02-asymmetric-bets"}',
  },
  {
    method: "POST",
    path: "/api/contact",
    description: "Submit a contact message (stored in the database).",
    example: 'POST body {"name":"Ada","email":"ada@x.io","subject":"Mentorship","message":"..."}',
  },
  {
    method: "GET",
    path: "/api/contact",
    description: "List stored contact messages from the database.",
    example: '[{"id":1,"name":"Ada","email":"ada@x.io",...}]',
  },
  {
    method: "GET",
    path: "/api/database",
    description: "Inspect the database: tables and row counts.",
    example: '{"tables":{"founders":4,"lessons":28,"contact_messages":2},...}',
  },
];
