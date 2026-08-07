/**
 * Seedwel Investment Limited — TRUE DATABASE LAYER (Firebase Firestore)
 *
 * This is now the canonical database for:
 * - Course content: modules, lessons, videos, niches, founders, posts
 * - Users: uid, email, name, role (admin | student), photoUrl, createdAt, lastSeen
 * - Progress: per-user completed lessonIds
 * - Certificates: $5 paid claims with payment status
 * - Payments: certificate fee transactions
 *
 * Architecture:
 * - Firestore collections are the source of truth.
 * - Client SDK reads/writes directly with Firestore Rules enforcing:
 *   - Public read for course content (tuition FREE)
 *   - User can read/write own progress + own certificate
 *   - Admin (role == admin) can write everything
 * - Server (storage.mjs) also syncs where possible, but client is primary.
 * - If Firestore is empty, we seed from bundled content.json (admin action).
 *
 * Admin role: stored as `role: "admin"` in `users/{uid}` doc + allowlist.
 * Detection: AuthProvider reads users/{uid} doc and merges with email allowlist.
 */

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
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db, CERTIFICATE_FEE_USD } from "./firebase";
import raw from "../data/content.json";

// ---------- Types ----------
export interface FirestoreUser {
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  role: "admin" | "student";
  isAdmin?: boolean;
  createdAt?: any;
  lastSeen?: any;
  displayRole?: string;
}

export interface CertificateClaim {
  id: string; // doc id (usually uid)
  uid: string;
  email: string;
  nameOnCertificate: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  tuitionModel: "FREE";
  feeUsd: number;
  paid: boolean;
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  paymentId?: string;
  paymentMethod?: "card" | "paypal" | "mobile_money" | "manual";
  paymentAt?: any;
  certificateNumber: string;
  incorporationNote: string;
  claimedAt?: any;
  issuedAt?: any;
  status: "eligible" | "claimed" | "revoked";
}

export interface PaymentRecord {
  id: string;
  uid: string;
  email: string;
  amountUsd: number;
  currency: string;
  purpose: "certificate_fee";
  status: "pending" | "succeeded" | "failed";
  method?: string;
  certificateClaimId?: string;
  createdAt: any;
}

export interface ProgressDoc {
  uid: string;
  lessonIds: string[];
  updatedAt: any;
}

// ---------- Collection refs ----------
const col = {
  lessons: collection(db, "lessons"),
  modules: collection(db, "modules"),
  videos: collection(db, "videos"),
  niches: collection(db, "niches"),
  founders: collection(db, "founders"),
  posts: collection(db, "posts"),
  users: collection(db, "users"),
  progress: collection(db, "user_progress"),
  certificates: collection(db, "certificates"),
  payments: collection(db, "certificate_payments"),
  investmentOpp: collection(db, "investment_opportunities"),
};

// ---------- Helpers ----------
function nowTs() {
  return Timestamp.now();
}

export function certificateIncorporationNote(): string {
  return (
    "Seedwel Investment Limited operates as a CERTIFICATE INCORPORATION entity registered 2025. " +
    "We have not built any physical school yet. Tuition for the Billionaire Blueprint curriculum is FREE worldwide. " +
    `Certificate verification & PDF issuance is a paid service: $${CERTIFICATE_FEE_USD} USD per claim to cover verification, anti-forgery registry, and incorporation administrative costs.`
  );
}

export function genCertificateNumber(name: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hash = Math.abs(
    name.split("").reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0)
  );
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SWL-${date}-${(hash % 100000).toString().padStart(5, "0")}-${rand}`;
}

// ---------- Content: fetch with Firestore first, fallback to bundled JSON ----------
export async function fetchLessonsFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(query(col.lessons, orderBy("number")));
    if (!snap.empty) return snap.docs.map((d) => d.data());
  } catch (e) {
    console.warn("[firestore] lessons fetch failed, fallback to bundled", e);
  }
  return (raw as any).lessons;
}

export async function fetchModulesFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(query(col.modules, orderBy("number")));
    if (!snap.empty) return snap.docs.map((d) => ({ ...d.data(), lessonCount: (raw as any).lessons.filter((l: any) => l.moduleId === d.id).length }));
  } catch (e) {
    console.warn("[firestore] modules fetch failed", e);
  }
  return (raw as any).modules.map((m: any) => ({ ...m, lessonCount: (raw as any).lessons.filter((l: any) => l.moduleId === m.id).length }));
}

export async function fetchFoundersFromFirestore(): Promise<any[]> {
  try {
    const snap = await getDocs(col.founders);
    if (!snap.empty) return snap.docs.map((d) => d.data());
  } catch {}
  return (raw as any).founders;
}

// ---------- Users / Roles — TRUE ADMIN SOURCE ----------
export async function ensureUserDoc(user: { uid: string; email: string; name?: string; photoUrl?: string; role?: "admin" | "student" }): Promise<FirestoreUser> {
  const ref = doc(db, "users", user.uid);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const data = existing.data() as FirestoreUser;
      // update lastSeen
      await updateDoc(ref, { lastSeen: serverTimestamp(), email: user.email || data.email }).catch(() => {});
      return { ...data, uid: user.uid, lastSeen: new Date().toISOString() } as FirestoreUser;
    }
  } catch (e) {
    console.warn("[firestore] ensureUserDoc read failed", e);
  }

  const newUser: FirestoreUser = {
    uid: user.uid,
    email: (user.email || "").toLowerCase(),
    name: user.name || (user.email || "Student").split("@")[0],
    photoUrl: user.photoUrl || "",
    role: user.role || "student",
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  };

  try {
    await setDoc(ref, newUser, { merge: true });
  } catch (e) {
    console.warn("[firestore] ensureUserDoc write failed", e);
  }
  return { ...newUser, createdAt: new Date().toISOString(), lastSeen: new Date().toISOString() } as FirestoreUser;
}

export async function getUserRole(uid: string): Promise<FirestoreUser | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) return { uid, ...snap.data() } as FirestoreUser;
  } catch {}
  return null;
}

export async function setUserRoleFirestore(uid: string, role: "admin" | "student"): Promise<FirestoreUser | null> {
  const ref = doc(db, "users", uid);
  try {
    await setDoc(ref, { role, lastSeen: serverTimestamp(), ...(role === "admin" ? { isAdmin: true } : {}) } as any, { merge: true });
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as FirestoreUser;
  } catch (e) {
    console.error("[firestore] setUserRole failed", e);
    throw e;
  }
  return null;
}

export async function listAllUsersFirestore(): Promise<FirestoreUser[]> {
  try {
    const snap = await getDocs(query(col.users, orderBy("lastSeen", "desc"), limit(500)));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as FirestoreUser));
  } catch (e) {
    console.warn("[firestore] listUsers failed", e);
    return [];
  }
}

export function subscribeToUsers(callback: (users: FirestoreUser[]) => void): Unsubscribe {
  try {
    return onSnapshot(query(col.users, orderBy("lastSeen", "desc"), limit(500)), (snap) => {
      callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as FirestoreUser)));
    });
  } catch {
    return () => {};
  }
}

export function subscribeToAdmins(callback: (admins: FirestoreUser[]) => void): Unsubscribe {
  try {
    return onSnapshot(query(col.users, where("role", "==", "admin"), limit(100)), (snap) => {
      callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as FirestoreUser)));
    });
  } catch {
    return () => {};
  }
}

// ---------- Progress — TRUE DATABASE ----------
export async function getProgressFirestore(uid: string): Promise<string[]> {
  try {
    const snap = await getDoc(doc(db, "user_progress", uid));
    if (snap.exists()) return (snap.data() as ProgressDoc).lessonIds || [];
  } catch (e) {
    console.warn("[firestore] getProgress failed", e);
  }
  return [];
}

export async function setProgressFirestore(uid: string, lessonId: string, complete: boolean): Promise<void> {
  const ref = doc(db, "user_progress", uid);
  try {
    const snap = await getDoc(ref);
    let ids: string[] = snap.exists() ? (snap.data() as ProgressDoc).lessonIds || [] : [];
    if (complete) {
      if (!ids.includes(lessonId)) ids.push(lessonId);
    } else {
      ids = ids.filter((id) => id !== lessonId);
    }
    await setDoc(ref, { uid, lessonIds: ids, updatedAt: serverTimestamp() } as ProgressDoc, { merge: true });
  } catch (e) {
    console.error("[firestore] setProgress failed", e);
    throw e;
  }
}

export function subscribeToProgress(uid: string, callback: (ids: string[]) => void): Unsubscribe {
  try {
    return onSnapshot(doc(db, "user_progress", uid), (snap) => {
      callback(snap.exists() ? (snap.data() as ProgressDoc).lessonIds || [] : []);
    });
  } catch {
    return () => {};
  }
}

// ---------- Certificates — $5 PAID, tuition FREE ----------
export async function getCertificateStatus(uid: string): Promise<CertificateClaim | null> {
  try {
    const snap = await getDoc(doc(db, "certificates", uid));
    if (snap.exists()) return snap.data() as CertificateClaim;
  } catch (e) {
    console.warn("[firestore] getCertificateStatus failed", e);
  }
  return null;
}

export async function createOrUpdateCertificateClaim(params: {
  uid: string;
  email: string;
  nameOnCertificate: string;
  completed: number;
  total: number;
}): Promise<CertificateClaim> {
  const { uid, email, nameOnCertificate, completed, total } = params;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const ref = doc(db, "certificates", uid);
  let existing: CertificateClaim | null = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existing = snap.data() as CertificateClaim;
  } catch {}

  const claim: CertificateClaim = {
    id: uid,
    uid,
    email,
    nameOnCertificate: nameOnCertificate.trim() || email.split("@")[0],
    completedLessons: completed,
    totalLessons: total,
    percentage: pct,
    tuitionModel: "FREE",
    feeUsd: CERTIFICATE_FEE_USD,
    paid: existing?.paid || false,
    paymentStatus: existing?.paymentStatus || "unpaid",
    paymentId: existing?.paymentId,
    paymentMethod: existing?.paymentMethod,
    certificateNumber: existing?.certificateNumber || genCertificateNumber(nameOnCertificate),
    incorporationNote: certificateIncorporationNote(),
    status: pct >= 100 ? (existing?.paid ? "claimed" : "eligible") : "eligible",
    claimedAt: existing?.claimedAt || serverTimestamp(),
    issuedAt: existing?.issuedAt,
  };

  try {
    await setDoc(ref, { ...claim, claimedAt: existing?.claimedAt || serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn("[firestore] createOrUpdateCertificateClaim failed", e);
  }
  return claim;
}

export async function markCertificatePaid(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
}): Promise<CertificateClaim | null> {
  const ref = doc(db, "certificates", params.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as CertificateClaim;
    const updated: Partial<CertificateClaim> = {
      paid: true,
      paymentStatus: "paid",
      paymentId: params.paymentId,
      paymentMethod: params.method,
      paymentAt: serverTimestamp() as any,
      status: "claimed",
      issuedAt: serverTimestamp() as any,
    };
    await updateDoc(ref, updated as any);
    return { ...data, ...updated } as CertificateClaim;
  } catch (e) {
    console.error("[firestore] markCertificatePaid failed", e);
    throw e;
  }
}

/**
 * Admin approves a payment. Updates payment record to "succeeded",
 * marks certificate as paid, and records who approved it.
 */
export async function approvePaymentByAdmin(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
  adminUid?: string;
}): Promise<CertificateClaim | null> {
  // 1. Update payment record to succeeded
  try {
    await updateDoc(doc(db, "certificate_payments", params.paymentId), {
      status: "succeeded",
      approvedBy: params.adminUid || "admin",
      approvedAt: serverTimestamp(),
    } as any);
  } catch (e) {
    console.error("[firestore] approvePaymentByAdmin: update payment failed", e);
    throw e;
  }

  // 2. Mark certificate as paid
  const ref = doc(db, "certificates", params.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as CertificateClaim;
    const updated: Partial<CertificateClaim> = {
      paid: true,
      paymentStatus: "paid",
      paymentId: params.paymentId,
      paymentMethod: params.method,
      paymentAt: serverTimestamp() as any,
      status: "claimed",
      issuedAt: serverTimestamp() as any,
      approvedBy: params.adminUid || "admin",
    };
    await updateDoc(ref, updated as any);
    return { ...data, ...updated } as CertificateClaim;
  } catch (e) {
    console.error("[firestore] approvePaymentByAdmin: mark cert paid failed", e);
    throw e;
  }
}

/**
 * Admin rejects a payment. Updates payment record to "failed".
 * Certificate claim reverts to "eligible" so student can try again.
 */
export async function rejectPaymentByAdmin(params: {
  uid: string;
  paymentId: string;
  reason?: string;
}): Promise<void> {
  // 1. Update payment record to failed
  try {
    await updateDoc(doc(db, "certificate_payments", params.paymentId), {
      status: "failed",
      rejectedAt: serverTimestamp(),
      rejectionReason: params.reason || "Rejected by admin",
    } as any);
  } catch (e) {
    console.error("[firestore] rejectPaymentByAdmin: update payment failed", e);
    throw e;
  }

  // 2. Revert certificate claim to eligible (so student can retry)
  const ref = doc(db, "certificates", params.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    await updateDoc(ref, {
      paid: false,
      paymentStatus: "unpaid",
      status: "eligible",
    } as any);
  } catch (e) {
    console.error("[firestore] rejectPaymentByAdmin: revert cert failed", e);
    throw e;
  }
}

/**
 * Mark a certificate claim as awaiting admin approval.
 * Called when student initiates payment.
 */
export async function setCertificatePendingApproval(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
}): Promise<void> {
  const ref = doc(db, "certificates", params.uid);
  try {
    await updateDoc(ref, {
      paymentStatus: "pending",
      paymentId: params.paymentId,
      paymentMethod: params.method,
      status: "eligible",
    } as any);
  } catch (e) {
    console.error("[firestore] setCertificatePendingApproval failed", e);
    throw e;
  }
}

/**
 * List all pending payments (for admin review).
 */
export async function listPendingPaymentsFirestore(): Promise<PaymentRecord[]> {
  try {
    const snap = await getDocs(
      query(col.payments, where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(100))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentRecord));
  } catch {
    return [];
  }
}

export async function createPaymentRecord(params: { uid: string; email: string; method: string; certificateClaimId?: string }): Promise<PaymentRecord> {
  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: PaymentRecord = {
    id,
    uid: params.uid,
    email: params.email,
    amountUsd: CERTIFICATE_FEE_USD,
    currency: "USD",
    purpose: "certificate_fee",
    status: "pending",
    method: params.method,
    certificateClaimId: params.certificateClaimId,
    createdAt: serverTimestamp(),
  };
  try {
    await setDoc(doc(db, "certificate_payments", id), record as any);
  } catch (e) {
    console.warn("[firestore] createPaymentRecord failed", e);
  }
  return record;
}

export async function confirmPaymentRecord(paymentId: string, success: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, "certificate_payments", paymentId), {
      status: success ? "succeeded" : "failed",
    } as any);
  } catch (e) {
    console.warn("[firestore] confirmPaymentRecord failed", e);
  }
}

export async function listCertificatesFirestore(): Promise<CertificateClaim[]> {
  try {
    const snap = await getDocs(query(col.certificates, orderBy("claimedAt", "desc"), limit(200)));
    return snap.docs.map((d) => d.data() as CertificateClaim);
  } catch {
    return [];
  }
}

export async function getCertificateByNumberFirestore(certNumber: string): Promise<CertificateClaim | null> {
  try {
    const q = query(col.certificates, where("certificateNumber", "==", certNumber.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as CertificateClaim;
    }
  } catch (e) {
    console.warn("[firestore] getCertificateByNumber failed", e);
  }
  return null;
}

// ---------- Seed content to Firestore (admin utility) ----------
export async function seedFirestoreFromBundledContent(): Promise<{ seeded: number }> {
  const batch = writeBatch(db);
  let count = 0;

  // modules
  for (const m of (raw as any).modules) {
    batch.set(doc(db, "modules", m.id), { ...m, lessonCount: (raw as any).lessons.filter((l: any) => l.moduleId === m.id).length, seededAt: nowTs() });
    count++;
  }
  // lessons
  for (const l of (raw as any).lessons) {
    batch.set(doc(db, "lessons", l.id), { ...l, seededAt: nowTs() });
    count++;
  }
  // videos
  for (const v of (raw as any).videos) {
    batch.set(doc(db, "videos", v.id), { ...v, seededAt: nowTs() });
    count++;
  }
  // niches
  for (const n of (raw as any).niches) {
    batch.set(doc(db, "niches", n.id), { ...n, seededAt: nowTs() });
    count++;
  }
  // founders
  for (const f of (raw as any).founders) {
    batch.set(doc(db, "founders", f.id), { ...f, seededAt: nowTs() });
    count++;
  }
  // posts
  for (const p of (raw as any).posts) {
    batch.set(doc(db, "posts", p.slug), { ...p, seededAt: nowTs() });
    count++;
  }

  try {
    await batch.commit();
  } catch (e) {
    console.error("[firestore] seed failed", e);
    throw e;
  }
  return { seeded: count };
}

// ---------- Leaderboard from Firestore progress ----------
export async function leaderboardFromFirestore(): Promise<{ rank: number; uid: string; name?: string; completed: number; clientId: string }[]> {
  try {
    const progressSnap = await getDocs(query(col.progress, orderBy("updatedAt", "desc"), limit(100)));
    const usersSnap = await getDocs(query(col.users, limit(200)));
    const userMap = new Map<string, FirestoreUser>();
    usersSnap.docs.forEach((d) => userMap.set(d.id, { uid: d.id, ...d.data() } as FirestoreUser));

    const entries = progressSnap.docs
      .map((d) => {
        const data = d.data() as ProgressDoc;
        const u = userMap.get(data.uid);
        return {
          uid: data.uid,
          clientId: data.uid.slice(0, 8),
          name: u?.name || u?.email || `Student ${data.uid.slice(0, 6)}`,
          completed: (data.lessonIds || []).length,
        };
      })
      .filter((e) => e.completed > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return entries;
  } catch (e) {
    console.warn("[firestore] leaderboard failed", e);
    return [];
  }
}
