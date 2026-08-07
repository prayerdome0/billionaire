// Firestore data layer — the TRUE Firebase database for Seedwel / Billionaire Blueprint.
//
// Collections:
//   modules | lessons | videos | niches | founders | posts   → the course database
//   users/{uid}        → registered profiles;  `role: "admin" | "student"` lives HERE
//   admins/{uid}       → public mirror of assigned admins (student dashboard reads it)
//   certificates/{uid} → Seedwel Certificate Incorporation registry ($5 issuance, tuition free)
//   counters/certificates → sequential serial numbers (SCI-YYYY-000123)
//
// Security is enforced by firestore.rules (publish them from the repo root).
// Everything here degrades gracefully: callers fall back to the REST API and the
// bundled curriculum when Firestore is unreachable (offline preview, rules not yet
// published, network blocked).

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  getCountFromServer,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  lessons as seedLessons,
  modules as seedModules,
  videos as seedVideos,
  niches as seedNiches,
  founders as seedFounders,
  posts as seedPosts,
} from "../data/content";

/* ============================== constants ============================== */

export type CourseCollection = "modules" | "lessons" | "videos" | "niches" | "founders" | "posts";
export const COURSE_COLLECTIONS: CourseCollection[] = ["modules", "lessons", "videos", "niches", "founders", "posts"];

/** Founder & management accounts — always admin, mirrored in firestore.rules. */
export const FOUNDER_ADMIN_EMAILS = [
  "seedwell@seedwel.com",
  "seedwell@seedwelinvestment.com",
  "zacheus@seedwelinvestment.com",
  "admin@seedwel.com",
];

/** Tuition is FREE. The only charge is the one-time certificate issuance fee. */
export const CERT_PRICE_USD = 5;

export const CERT_STATUSES = ["pending_payment", "paid", "claimed"] as const;
export type CertificateStatus = (typeof CERT_STATUSES)[number];

export interface FsUserProfile {
  uid: string;
  email: string;
  name: string;
  photoUrl: string;
  role: "admin" | "student";
  created_at: string;
  last_seen: string;
}

export interface AdminAssignment {
  uid: string;
  email: string;
  name: string;
  role: "admin";
  granted_by?: string;
  granted_at?: string;
  dev?: boolean;
}

export interface CertificateRecord {
  uid: string;
  email: string;
  name: string;
  serial: string;
  status: CertificateStatus;
  /** "demo-card" | "manual" | "admin-grant" */
  method: string;
  amountUsd: number;
  cardLast4?: string;
  note?: string;
  completed: number;
  total: number;
  pct: number;
  created_at: string;
  paid_at?: string;
  claimed_at?: string;
  updated_at?: string;
}

/* ============================== helpers ============================== */

const nowIso = () => new Date().toISOString();
const lower = (v: string) => String(v || "").trim().toLowerCase();

/** Resolve with `fallback` after `ms` — keeps UX snappy when Firestore is unreachable. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/** Reject after `ms` — for user-initiated actions that must report honest failure. */
function rejecting<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_res, rej) => setTimeout(() => rej(new Error(`${label} timed out — check the Firestore connection and rules.`)), ms)),
  ]);
}

/* ====================== COURSE DATABASE (content) ====================== */

const COURSE_SORT: Record<CourseCollection, (a: any, b: any) => number> = {
  modules: (a, b) => (a.number ?? 0) - (b.number ?? 0),
  lessons: (a, b) => (a.number ?? 0) - (b.number ?? 0),
  videos: (a, b) => String(a.id).localeCompare(String(b.id)),
  niches: (a, b) => String(a.id).localeCompare(String(b.id)),
  founders: (a, b) => String(a.id).localeCompare(String(b.id)),
  posts: (a, b) => String(b.date || "").localeCompare(String(a.date || "")),
};

/** Read an entire course collection from Firestore. Throws when unavailable. */
export async function fetchCourseCollection<T = Record<string, unknown>>(col: CourseCollection): Promise<T[]> {
  const snap = await rejecting(getDocs(collection(db, col)), 12000, `Loading ${col}`);
  const rows = snap.docs.map((d) => d.data() as T);
  return rows.sort(COURSE_SORT[col] as (a: T, b: T) => number);
}

/** Read one course document (e.g. a lesson) from Firestore. */
export async function fetchCourseDoc<T = Record<string, unknown>>(col: CourseCollection, id: string): Promise<T | null> {
  const snap = await rejecting(getDoc(doc(db, col, id)), 12000, `Loading ${col}/${id}`);
  return snap.exists() ? (snap.data() as T) : null;
}

/** Document counts per course collection (admin "Firestore DB" card). */
export async function courseContentCounts(): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  await Promise.all(
    COURSE_COLLECTIONS.map(async (col) => {
      try {
        const c = await getCountFromServer(collection(db, col));
        out[col] = c.data().count;
      } catch {
        out[col] = -1; // unreachable / rule blocked
      }
    })
  );
  return out;
}

/** Publish the bundled curriculum into Firestore (admin uses this once to seed
 *  the true database). Uses batched writes; returns per-collection counts written. */
export async function publishCourseContent(
  onProgress?: (msg: string) => void
): Promise<Record<string, number>> {
  const sets: [CourseCollection, Record<string, unknown>[], (x: any) => string][] = [
    ["modules", seedModules as unknown as Record<string, unknown>[], (m) => m.id],
    ["lessons", seedLessons as unknown as Record<string, unknown>[], (l) => l.id],
    ["videos", seedVideos as unknown as Record<string, unknown>[], (v) => v.id],
    ["niches", seedNiches as unknown as Record<string, unknown>[], (n) => n.id],
    ["founders", seedFounders as unknown as Record<string, unknown>[], (f) => f.id],
    ["posts", seedPosts as unknown as Record<string, unknown>[], (p) => p.slug],
  ];
  const written: Record<string, number> = {};
  let batch = writeBatch(db);
  let ops = 0;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };
  for (const [col, items, idOf] of sets) {
    onProgress?.(`Writing ${items.length} ${col}…`);
    for (const item of items) {
      batch.set(doc(db, col, String(idOf(item))), { ...item, updated_at: nowIso() });
      ops += 1;
      written[col] = (written[col] || 0) + 1;
      if (ops >= 450) await flush();
    }
  }
  await flush();
  onProgress?.("Done — course database is live in Firestore.");
  return written;
}

/* ==================== USERS & ADMIN ROLES (in Firebase) ==================== */

/**
 * Upsert the signed-in user's profile doc. Admin role is stored in Firebase:
 * founder emails are auto-promoted; everyone else keeps their stored role or
 * starts as "student". Returns the Firebase-backed profile (or null offline).
 */
export async function ensureUserProfile(u: {
  uid: string;
  email: string;
  name: string;
  photoUrl: string;
}): Promise<FsUserProfile | null> {
  const email = lower(u.email);
  const allowlisted = FOUNDER_ADMIN_EMAILS.includes(email);
  try {
    const run = async (): Promise<FsUserProfile> => {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const prev = snap.data() as Partial<FsUserProfile>;
        const role: "admin" | "student" = allowlisted || prev.role === "admin" ? "admin" : "student";
        const next: FsUserProfile = {
          uid: u.uid,
          email,
          name: u.name || prev.name || email.split("@")[0],
          photoUrl: u.photoUrl || prev.photoUrl || "",
          role,
          created_at: prev.created_at || nowIso(),
          last_seen: nowIso(),
        };
        await setDoc(ref, next, { merge: true });
        await mirrorAdmin(next, "firebase-auth");
        return next;
      }
      const created: FsUserProfile = {
        uid: u.uid,
        email,
        name: u.name || email.split("@")[0],
        photoUrl: u.photoUrl || "",
        role: allowlisted ? "admin" : "student",
        created_at: nowIso(),
        last_seen: nowIso(),
      };
      await setDoc(ref, created);
      await mirrorAdmin(created, "firebase-auth");
      return created;
    };
    return await rejecting(run(), 10000, "Syncing your profile");
  } catch {
    return null;
  }
}

/** Read only the role field for a user (null when unknown/unreachable). */
export async function getFirebaseRole(uid: string): Promise<"admin" | "student" | null> {
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", uid)), 8000, null);
    const role = (snap?.data() as Partial<FsUserProfile> | undefined)?.role;
    return role === "admin" ? "admin" : role === "student" ? "student" : null;
  } catch {
    return null;
  }
}

/** Keep the public admins/{uid} mirror in sync with users/{uid}.role. */
async function mirrorAdmin(profile: FsUserProfile, grantedBy: string): Promise<void> {
  try {
    const ref = doc(db, "admins", profile.uid);
    if (profile.role === "admin") {
      const existing = await getDoc(ref);
      const prev = existing.exists() ? existing.data() : {};
      await setDoc(ref, {
        uid: profile.uid,
        email: profile.email,
        name: profile.name,
        role: "admin",
        granted_by: prev.granted_by || grantedBy,
        granted_at: prev.granted_at || nowIso(),
      });
    } else {
      await deleteDoc(ref).catch(() => {});
    }
  } catch {
    /* mirror is best-effort */
  }
}

/** Admin action: assign/revoke the admin role IN Firebase (users + admins mirror). */
export async function setFirebaseRole(
  target: { uid: string; email?: string; name?: string },
  role: "admin" | "student",
  grantedBy: string
): Promise<void> {
  const uid = target.uid;
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref).catch(() => null);
  const prev = (snap?.exists() ? snap.data() : {}) as Partial<FsUserProfile>;
  const profile: FsUserProfile = {
    uid,
    email: lower(target.email || prev.email || ""),
    name: target.name || prev.name || "",
    photoUrl: prev.photoUrl || "",
    role,
    created_at: prev.created_at || nowIso(),
    last_seen: prev.last_seen || nowIso(),
  };
  await rejecting(setDoc(ref, profile, { merge: true }), 10000, "Saving the role in Firebase");
  await rejecting(mirrorAdmin(profile, grantedBy), 10000, "Updating the admin registry");
}

/** Who is assigned admin — read by the student dashboard. Public per rules. */
export async function listAssignedAdmins(): Promise<AdminAssignment[]> {
  try {
    const snap = await withTimeout(getDocs(collection(db, "admins")), 8000, null);
    if (!snap) return [];
    return snap.docs
      .map((d) => d.data() as AdminAssignment)
      .sort((a, b) => a.email.localeCompare(b.email));
  } catch {
    return [];
  }
}

/** Full user list (admin console; allowed by rules for admins). */
export async function listFirebaseUsers(): Promise<FsUserProfile[]> {
  const snap = await rejecting(getDocs(collection(db, "users")), 12000, "Loading Firebase users");
  return snap.docs
    .map((d) => d.data() as FsUserProfile)
    .sort((a, b) => String(b.last_seen).localeCompare(String(a.last_seen)));
}

/* =========== CERTIFICATE REGISTRY (Seedwel Certificate Incorporation) =========== */

export async function getCertificate(uid: string): Promise<CertificateRecord | null> {
  try {
    const snap = await withTimeout(getDoc(doc(db, "certificates", uid)), 8000, null);
    return snap && snap.exists() ? (snap.data() as CertificateRecord) : null;
  } catch {
    return null;
  }
}

/** Sequential, atomically-allocated registry serial: SCI-2026-000123. */
async function allocateSerial(): Promise<string> {
  const year = new Date().getFullYear();
  const ref = doc(db, "counters", "certificates");
  const n = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = snap.exists() ? Number((snap.data() as { next?: number }).next || 1) : 1;
    tx.set(ref, { next: next + 1, updated_at: nowIso() });
    return next;
  });
  return `SCI-${year}-${String(n).padStart(6, "0")}`;
}

/**
 * Start a certificate order. Always pending_payment for manual flows.
 * The serial doubles as the student's payment reference.
 */
export async function createCertificateOrder(input: {
  uid: string;
  email: string;
  name: string;
  completed: number;
  total: number;
  pct: number;
  method: "manual" | "demo-card";
  note?: string;
}): Promise<CertificateRecord> {
  const run = async (): Promise<CertificateRecord> => {
    const ref = doc(db, "certificates", input.uid);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const prev = existing.data() as CertificateRecord;
      if (prev.status === "paid" || prev.status === "claimed") return prev;
      // Re-use the pending order (keep the serial so payment references stay stable)
      const refreshed: CertificateRecord = {
        ...prev,
        name: input.name || prev.name,
        email: input.email || prev.email,
        completed: input.completed,
        total: input.total,
        pct: input.pct,
        note: input.note ?? prev.note,
        updated_at: nowIso(),
      };
      await setDoc(ref, refreshed, { merge: true });
      return refreshed;
    }
    const record: CertificateRecord = {
      uid: input.uid,
      email: lower(input.email),
      name: input.name,
      serial: await allocateSerial(),
      status: "pending_payment",
      method: input.method,
      amountUsd: CERT_PRICE_USD,
      note: input.note,
      completed: input.completed,
      total: input.total,
      pct: input.pct,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await setDoc(ref, record);
    return record;
  };
  return rejecting(run(), 15000, "Creating your certificate order");
}

/** Instant card checkout (built-in demo gateway). Marks the registration PAID. */
export async function payCertificate(
  uid: string,
  opts: { cardLast4?: string; method?: "demo-card" | "admin-grant" }
): Promise<CertificateRecord> {
  const run = async (): Promise<CertificateRecord> => {
    const ref = doc(db, "certificates", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("No certificate order found — start the claim first.");
    const prev = snap.data() as CertificateRecord;
    const paid: CertificateRecord = {
      ...prev,
      status: "paid",
      method: opts.method || prev.method || "demo-card",
      cardLast4: opts.cardLast4,
      paid_at: nowIso(),
      updated_at: nowIso(),
    };
    await setDoc(ref, paid, { merge: true });
    return paid;
  };
  return rejecting(run(), 15000, "Processing the $5 certificate payment");
}

/** Mark the certificate as claimed (issued + downloaded). */
export async function markCertificateClaimed(uid: string, name: string): Promise<CertificateRecord | null> {
  try {
    const ref = doc(db, "certificates", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const prev = snap.data() as CertificateRecord;
    const next: CertificateRecord = { ...prev, name: name || prev.name, status: "claimed", claimed_at: nowIso(), updated_at: nowIso() };
    await setDoc(ref, next, { merge: true });
    return next;
  } catch {
    return null;
  }
}

/* -------- admin certificate management -------- */

export async function listCertificates(): Promise<CertificateRecord[]> {
  const q = query(collection(db, "certificates"), where("amountUsd", ">", 0));
  const snap = await rejecting(getDocs(q), 12000, "Loading the certificate registry");
  return snap.docs
    .map((d) => d.data() as CertificateRecord)
    .sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)));
}

/** Admin: approve a manual payment (paid) or send it back to pending. */
export async function adminSetCertificateStatus(uid: string, status: CertificateStatus): Promise<void> {
  const ref = doc(db, "certificates", uid);
  const patch: Partial<CertificateRecord> =
    status === "paid"
      ? { status, method: "admin-grant", paid_at: nowIso(), updated_at: nowIso() }
      : { status, paid_at: "", claimed_at: "", updated_at: nowIso() };
  await rejecting(updateDoc(ref, patch), 12000, "Updating the certificate registry");
}
