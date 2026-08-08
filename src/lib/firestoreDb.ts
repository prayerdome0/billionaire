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

export type CertificatePaymentMethod = "card" | "paypal" | "mobile_money" | "manual";
export type CertificateDeliveryStatus = "not_requested" | "awaiting_admin" | "sent";
export type CertificateClaimStatus = "eligible" | "quotation_requested" | "issued" | "claimed" | "revoked";

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
  /** pending = quotation is in the admin queue; paid = payment verified by admin. */
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  paymentId?: string;
  paymentMethod?: CertificatePaymentMethod;
  paymentAt?: any;
  certificateNumber: string;
  incorporationNote: string;
  claimedAt?: any;
  issuedAt?: any;
  status: CertificateClaimStatus;
  approvedBy?: string;
  /** Student sends a $5 quotation; the administrator manually sends the certificate within 48 hours. */
  quotationNumber?: string;
  quotationRequestedAt?: any;
  deliveryDueAt?: any;
  deliveryStatus?: CertificateDeliveryStatus;
  deliveryMethod?: "email" | "manual";
  deliveredAt?: any;
  deliveredBy?: string;
  deliveryNote?: string;
  lastPaymentRejectionReason?: string;
  lastPaymentRejectedAt?: any;
  /** Cloudinary-hosted PDF copy (secure URL) — optional backup after delivery. */
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  cloudinaryUploadedAt?: any;
}

export interface PaymentRecord {
  id: string;
  uid: string;
  email: string;
  amountUsd: number;
  currency: string;
  purpose: "certificate_fee";
  /** pending = an admin needs to verify the quotation/payment and send the certificate. */
  status: "pending" | "succeeded" | "failed";
  method?: CertificatePaymentMethod | string;
  certificateClaimId?: string;
  requestType?: "certificate_quotation";
  quotationNumber?: string;
  deliveryWindowHours?: number;
  requestMessage?: string;
  createdAt: any;
  approvedBy?: string;
  approvedAt?: any;
  sentAt?: any;
  rejectionReason?: string;
  rejectedAt?: any;
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

/**
 * Firestore rejects `undefined` fields by default. The former certificate
 * claim builder included optional fields with undefined values, swallowed that
 * create failure, and then tried updateDoc on a document that was never made.
 * Remove only top-level undefined values (all certificate records are flat)
 * before every certificate/payment write.
 */
function withoutUndefined<T extends Record<string, any>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export function certificateIncorporationNote(): string {
  return (
    "Seedwel Investment Limited operates as a CERTIFICATE INCORPORATION entity registered 2025. " +
    "We have not built any physical school yet. Tuition for the Billionaire Blueprint curriculum is FREE worldwide. " +
    `Certificate verification & PDF issuance is a paid service: $${CERTIFICATE_FEE_USD} USD per claim to cover verification, anti-forgery registry, and incorporation administrative costs.`
  );
}

export const CERTIFICATE_DELIVERY_WINDOW_HOURS = 48;

export function genCertificateNumber(name: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hash = Math.abs(
    name.split("").reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0)
  );
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `SWL-${date}-${(hash % 100000).toString().padStart(5, "0")}-${rand}`;
}

export function genQuotationNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `QTE-${date}-${rand}`;
}

/**
 * Legacy paid claims pre-date delivery tracking. Treat those as issued so
 * existing students do not lose access while new requests use `deliveryStatus`.
 */
export function isCertificateIssued(claim: CertificateClaim | null | undefined): boolean {
  if (!claim) return false;
  if (claim.deliveryStatus === "sent" || claim.status === "issued") return true;
  return !claim.deliveryStatus && !!claim.paid;
}

export function isCertificateAwaitingAdmin(claim: CertificateClaim | null | undefined): boolean {
  return !!claim && (claim.deliveryStatus === "awaiting_admin" || claim.paymentStatus === "pending" || claim.status === "quotation_requested");
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

// ---------- Certificates — $5 paid, quotation sent to admin, manual delivery ----------
export async function getCertificateStatus(uid: string): Promise<CertificateClaim | null> {
  try {
    const snap = await getDoc(doc(db, "certificates", uid));
    if (snap.exists()) return { id: snap.id, ...snap.data() } as CertificateClaim;
  } catch (e) {
    console.warn("[firestore] getCertificateStatus failed", e);
  }
  return null;
}

/**
 * Creates the certificate claim when needed and keeps progress/name details in
 * sync. Unlike the former implementation, a failed create is surfaced to the
 * caller instead of returning an in-memory claim that does not exist in
 * Firestore; that was the source of `No document to update` on the next step.
 */
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
    if (snap.exists()) existing = { id: snap.id, ...snap.data() } as CertificateClaim;
  } catch (e) {
    // A later setDoc can still succeed from Firestore's local cache. Log this
    // diagnostic, but never pretend the resulting claim has been persisted.
    console.warn("[firestore] read certificate claim before save failed", e);
  }

  const alreadyIssued = isCertificateIssued(existing);
  const awaitingAdmin = isCertificateAwaitingAdmin(existing);
  const status: CertificateClaimStatus = alreadyIssued
    ? "issued"
    : awaitingAdmin
      ? "quotation_requested"
      : existing?.status === "revoked"
        ? "revoked"
        : "eligible";

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
    paid: !!existing?.paid,
    paymentStatus: existing?.paymentStatus || "unpaid",
    paymentId: existing?.paymentId,
    paymentMethod: existing?.paymentMethod,
    paymentAt: existing?.paymentAt,
    certificateNumber: existing?.certificateNumber || genCertificateNumber(nameOnCertificate || email),
    incorporationNote: certificateIncorporationNote(),
    status,
    claimedAt: existing?.claimedAt || serverTimestamp(),
    issuedAt: existing?.issuedAt,
    approvedBy: existing?.approvedBy,
    quotationNumber: existing?.quotationNumber,
    quotationRequestedAt: existing?.quotationRequestedAt,
    deliveryDueAt: existing?.deliveryDueAt,
    deliveryStatus: alreadyIssued ? "sent" : awaitingAdmin ? "awaiting_admin" : "not_requested",
    deliveryMethod: existing?.deliveryMethod,
    deliveredAt: existing?.deliveredAt,
    deliveredBy: existing?.deliveredBy,
    deliveryNote: existing?.deliveryNote,
    lastPaymentRejectionReason: existing?.lastPaymentRejectionReason,
    lastPaymentRejectedAt: existing?.lastPaymentRejectedAt,
    // Preserve the Cloudinary-hosted copy across claim updates.
    cloudinaryUrl: existing?.cloudinaryUrl,
    cloudinaryPublicId: existing?.cloudinaryPublicId,
    cloudinaryUploadedAt: existing?.cloudinaryUploadedAt,
  };

  try {
    // setDoc with merge is intentionally used here: it creates a claim when it
    // does not exist and therefore cannot produce Firestore's update-not-found
    // error for certificates/{uid}.
    await setDoc(ref, withoutUndefined(claim) as any, { merge: true });
    return claim;
  } catch (e) {
    console.error("[firestore] createOrUpdateCertificateClaim failed", e);
    const detail = e instanceof Error ? e.message : "unknown Firestore error";
    throw new Error(`Could not save your certificate request. Please try again. (${detail})`);
  }
}

/**
 * Atomically creates the admin-queue payment quotation and updates (or creates)
 * the certificate claim. Keeping both writes in one batch removes the race
 * where the UI used to call updateDoc before certificates/{uid} existed.
 */
export async function submitCertificateQuotation(params: {
  claim: CertificateClaim;
  method: CertificatePaymentMethod;
}): Promise<{ claim: CertificateClaim; payment: PaymentRecord }> {
  const { claim, method } = params;
  if (!claim?.uid || !claim.email) throw new Error("A signed-in student and certificate claim are required.");
  if (claim.totalLessons < 1 || claim.completedLessons < claim.totalLessons) {
    throw new Error("Complete all lessons before sending a certificate quotation.");
  }
  if (isCertificateIssued(claim)) {
    throw new Error("This certificate has already been issued.");
  }
  if (isCertificateAwaitingAdmin(claim)) {
    throw new Error("Your certificate quotation is already with the admin.");
  }

  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const quotationNumber = genQuotationNumber();
  const requestedAt = Timestamp.now();
  const deliveryDueAt = Timestamp.fromDate(new Date(Date.now() + CERTIFICATE_DELIVERY_WINDOW_HOURS * 60 * 60 * 1000));
  const certificateRef = doc(db, "certificates", claim.uid);
  const paymentRef = doc(db, "certificate_payments", id);

  const updatedClaim: CertificateClaim = {
    ...claim,
    id: claim.uid,
    uid: claim.uid,
    email: claim.email,
    tuitionModel: "FREE",
    feeUsd: CERTIFICATE_FEE_USD,
    paid: false,
    paymentStatus: "pending",
    paymentId: id,
    paymentMethod: method,
    status: "quotation_requested",
    claimedAt: claim.claimedAt || serverTimestamp(),
    quotationNumber,
    quotationRequestedAt: serverTimestamp() as any,
    deliveryDueAt,
    deliveryStatus: "awaiting_admin",
    deliveryMethod: "email",
    // A retry after an admin rejection starts a fresh request.
    lastPaymentRejectionReason: undefined,
    lastPaymentRejectedAt: undefined,
  };

  const payment: PaymentRecord = {
    id,
    uid: claim.uid,
    email: claim.email,
    amountUsd: CERTIFICATE_FEE_USD,
    currency: "USD",
    purpose: "certificate_fee",
    status: "pending",
    method,
    certificateClaimId: claim.id || claim.uid,
    requestType: "certificate_quotation",
    quotationNumber,
    deliveryWindowHours: CERTIFICATE_DELIVERY_WINDOW_HOURS,
    requestMessage: `Student requested a certificate. Verify the $${CERTIFICATE_FEE_USD} payment and send the certificate within ${CERTIFICATE_DELIVERY_WINDOW_HOURS} hours.`,
    createdAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(certificateRef, withoutUndefined(updatedClaim) as any, { merge: true });
  batch.set(paymentRef, withoutUndefined(payment) as any);

  try {
    await batch.commit();
  } catch (e) {
    console.error("[firestore] submitCertificateQuotation failed", e);
    const detail = e instanceof Error ? e.message : "unknown Firestore error";
    throw new Error(`Could not send the quotation to the admin. Please try again. (${detail})`);
  }

  return {
    claim: { ...updatedClaim, quotationRequestedAt: requestedAt, deliveryDueAt },
    payment: { ...payment, createdAt: requestedAt },
  };
}

/**
 * Stores a hosted backup PDF only after a claim exists. `setDoc(..., merge)`
 * prevents the raw Firestore "No document to update" error if an old/deleted
 * claim is encountered.
 */
export async function updateCertificateCloudinary(params: {
  uid: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
}): Promise<void> {
  try {
    const ref = doc(db, "certificates", params.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn("[firestore] skipped Cloudinary update because the certificate claim no longer exists");
      return;
    }
    await setDoc(
      ref,
      {
        cloudinaryUrl: params.cloudinaryUrl,
        cloudinaryPublicId: params.cloudinaryPublicId,
        cloudinaryUploadedAt: serverTimestamp(),
      } as any,
      { merge: true }
    );
  } catch (e) {
    console.warn("[firestore] updateCertificateCloudinary failed", e);
  }
}

/**
 * Legacy helper retained for callers that only need to mark payment verified.
 * It deliberately does not mark a certificate delivered; the student still
 * waits for an administrator to send it.
 */
export async function markCertificatePaid(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
}): Promise<CertificateClaim | null> {
  const ref = doc(db, "certificates", params.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = { id: snap.id, ...snap.data() } as CertificateClaim;
  const updated: Partial<CertificateClaim> = {
    paid: true,
    paymentStatus: "paid",
    paymentId: params.paymentId,
    paymentMethod: params.method,
    paymentAt: serverTimestamp() as any,
    status: isCertificateIssued(data) ? "issued" : "quotation_requested",
    deliveryStatus: isCertificateIssued(data) ? "sent" : "awaiting_admin",
  };
  await setDoc(ref, withoutUndefined(updated) as any, { merge: true });
  return { ...data, ...updated } as CertificateClaim;
}

/**
 * Records the final manual step: payment is verified and the administrator has
 * sent the certificate to the student's registered email. The portal records
 * that delivery; it does not falsely claim to send email on its own.
 */
export async function markCertificateSentByAdmin(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
  adminUid?: string;
  deliveryNote?: string;
}): Promise<CertificateClaim | null> {
  const paymentRef = doc(db, "certificate_payments", params.paymentId);
  const certificateRef = doc(db, "certificates", params.uid);
  const [paymentSnap, certificateSnap] = await Promise.all([getDoc(paymentRef), getDoc(certificateRef)]);

  if (!paymentSnap.exists()) {
    throw new Error("This certificate quotation no longer exists. Ask the student to submit a new request.");
  }
  if (!certificateSnap.exists()) {
    throw new Error("The student's certificate claim is missing. Ask the student to submit a new quotation before sending the certificate.");
  }

  const data = { id: certificateSnap.id, ...certificateSnap.data() } as CertificateClaim;
  const adminUid = params.adminUid || "admin";
  const updated: Partial<CertificateClaim> = {
    paid: true,
    paymentStatus: "paid",
    paymentId: params.paymentId,
    paymentMethod: params.method || data.paymentMethod || "manual",
    paymentAt: serverTimestamp() as any,
    status: "issued",
    issuedAt: serverTimestamp() as any,
    approvedBy: adminUid,
    deliveryStatus: "sent",
    deliveryMethod: "email",
    deliveredAt: serverTimestamp() as any,
    deliveredBy: adminUid,
    deliveryNote: params.deliveryNote?.trim() || data.deliveryNote,
  };

  const batch = writeBatch(db);
  batch.set(
    paymentRef,
    {
      status: "succeeded",
      approvedBy: adminUid,
      approvedAt: serverTimestamp(),
      sentAt: serverTimestamp(),
    } as any,
    { merge: true }
  );
  batch.set(certificateRef, withoutUndefined(updated) as any, { merge: true });

  try {
    await batch.commit();
  } catch (e) {
    console.error("[firestore] markCertificateSentByAdmin failed", e);
    const detail = e instanceof Error ? e.message : "unknown Firestore error";
    throw new Error(`Could not record certificate delivery. (${detail})`);
  }

  return { ...data, ...updated } as CertificateClaim;
}

/** Backwards-compatible alias; approval now means payment verified + certificate sent. */
export async function approvePaymentByAdmin(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
  adminUid?: string;
}): Promise<CertificateClaim | null> {
  return markCertificateSentByAdmin(params);
}

/**
 * Admin rejects a quotation and makes the student eligible to submit a fresh
 * payment request. Missing records produce a clear message instead of an
 * updateDoc "No document" exception.
 */
export async function rejectPaymentByAdmin(params: {
  uid: string;
  paymentId: string;
  reason?: string;
}): Promise<void> {
  const paymentRef = doc(db, "certificate_payments", params.paymentId);
  const certificateRef = doc(db, "certificates", params.uid);
  const [paymentSnap, certificateSnap] = await Promise.all([getDoc(paymentRef), getDoc(certificateRef)]);

  if (!paymentSnap.exists()) {
    throw new Error("This certificate quotation no longer exists.");
  }
  if (!certificateSnap.exists()) {
    throw new Error("The certificate claim is missing, so this quotation cannot be rejected safely.");
  }

  const reason = params.reason?.trim() || "Payment could not be verified by admin";
  const batch = writeBatch(db);
  batch.set(
    paymentRef,
    {
      status: "failed",
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
    } as any,
    { merge: true }
  );
  batch.set(
    certificateRef,
    {
      paid: false,
      paymentStatus: "unpaid",
      status: "eligible",
      deliveryStatus: "not_requested",
      lastPaymentRejectionReason: reason,
      lastPaymentRejectedAt: serverTimestamp(),
    } as any,
    { merge: true }
  );
  await batch.commit();
}

/**
 * Compatibility helper for legacy callers. New code uses
 * submitCertificateQuotation(), which creates the claim and payment record in
 * one atomic batch. This function validates the document before merging so it
 * can never throw Firestore's raw update-not-found error.
 */
export async function setCertificatePendingApproval(params: {
  uid: string;
  paymentId: string;
  method: CertificateClaim["paymentMethod"];
}): Promise<void> {
  const ref = doc(db, "certificates", params.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Certificate claim not found. Create the certificate quotation before marking it pending.");
  }
  await setDoc(
    ref,
    withoutUndefined({
      paymentStatus: "pending",
      paymentId: params.paymentId,
      paymentMethod: params.method,
      status: "quotation_requested",
      deliveryStatus: "awaiting_admin",
      quotationRequestedAt: serverTimestamp(),
      deliveryDueAt: Timestamp.fromDate(new Date(Date.now() + CERTIFICATE_DELIVERY_WINDOW_HOURS * 60 * 60 * 1000)),
    }) as any,
    { merge: true }
  );
}

function timestampMillis(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * List admin-queue quotations without a compound Firestore index. Sorting is
 * done in the client, which avoids a silent empty queue when no composite
 * index exists for status + createdAt.
 */
export async function listPendingPaymentsFirestore(): Promise<PaymentRecord[]> {
  try {
    const snap = await getDocs(query(col.payments, where("status", "==", "pending"), limit(100)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as PaymentRecord))
      .sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
  } catch (e) {
    console.warn("[firestore] list pending certificate quotations failed", e);
    return [];
  }
}

/** Legacy standalone payment-record writer. New student flow uses the atomic quotation batch above. */
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
    requestType: "certificate_quotation",
    quotationNumber: genQuotationNumber(),
    deliveryWindowHours: CERTIFICATE_DELIVERY_WINDOW_HOURS,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "certificate_payments", id), withoutUndefined(record) as any);
  return record;
}

export async function confirmPaymentRecord(paymentId: string, success: boolean): Promise<void> {
  const ref = doc(db, "certificate_payments", paymentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Certificate payment record not found.");
  await setDoc(ref, { status: success ? "succeeded" : "failed" } as any, { merge: true });
}

export async function listCertificatesFirestore(): Promise<CertificateClaim[]> {
  try {
    const snap = await getDocs(query(col.certificates, limit(200)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as CertificateClaim))
      .sort((a, b) => timestampMillis(b.claimedAt) - timestampMillis(a.claimedAt));
  } catch (e) {
    console.warn("[firestore] list certificate claims failed", e);
    return [];
  }
}

export async function getCertificateByNumberFirestore(certNumber: string): Promise<CertificateClaim | null> {
  try {
    const q = query(col.certificates, where("certificateNumber", "==", certNumber.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const found = snap.docs[0];
      return { id: found.id, ...found.data() } as CertificateClaim;
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
  // success stories (successful people + their videos)
  for (const s of (raw as any).successStories || []) {
    batch.set(doc(db, "successStories", s.id), { ...s, seededAt: nowTs() });
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
