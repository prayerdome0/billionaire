/**
 * Certificate Service — $5 paid claim, tuition FREE, incorporation model
 *
 * Business rules (from user):
 * - Tuition is FREE for everyone.
 * - Certificate is $5 to claim (paid) — verification, anti-forgery, incorporation admin fee.
 * - We have NOT built any physical school; we are a Certificate Incorporation entity registered 2025.
 * - Admin role is stored in Firebase users/{uid} with role field.
 * - Admin must APPROVE each payment before certificate is issued.
 *
 * Payment flow:
 * 1. Student initiates payment → payment record created with status "pending"
 * 2. Certificate claim status set to "pending_approval"
 * 3. Admin reviews and approves/rejects
 * 4. On approve → payment status "succeeded", certificate marked paid
 * 5. On reject → payment status "failed", certificate stays eligible
 */

import { CERTIFICATE_FEE_USD } from "./firebase";
import {
  getCertificateStatus,
  createOrUpdateCertificateClaim,
  createPaymentRecord,
  approvePaymentByAdmin,
  rejectPaymentByAdmin,
  certificateIncorporationNote,
  genCertificateNumber,
  type CertificateClaim,
} from "./firestoreDb";

export const CERTIFICATE_FEE = CERTIFICATE_FEE_USD;
export const TUITION_FREE = true;
export const INCORPORATION_MESSAGE =
  "Seedwel Investment Limited is a Certificate Incorporation entity registered in 2025. " +
  "We have NOT built any physical school structure yet. " +
  "We provide educational curriculum FREE of charge (tuition = $0). " +
  "Official certificate issuance, verification registry, and incorporation administrative handling is a paid service at $5 per certificate. " +
  "All payments require admin approval before the certificate is issued.";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: "requires_payment" | "pending" | "processing" | "succeeded" | "failed";
  paymentMethod: "card" | "paypal" | "mobile_money" | "manual";
  created: number;
}

export async function checkEligibility(completed: number, total: number): Promise<{ eligible: boolean; pct: number; remaining: number }> {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return {
    eligible: completed >= total && total > 0,
    pct,
    remaining: Math.max(0, total - completed),
  };
}

export async function getOrCreateClaim(uid: string, email: string, name: string, completed: number, total: number): Promise<CertificateClaim> {
  const existing = await getCertificateStatus(uid);
  if (existing && existing.nameOnCertificate === name && existing.completedLessons === completed) {
    return existing;
  }
  return createOrUpdateCertificateClaim({ uid, email, nameOnCertificate: name, completed, total });
}

/**
 * Student initiates a payment. Creates a payment record with "pending" status
 * and updates the certificate claim to "awaiting_approval".
 * No automatic processing — admin must approve.
 */
export async function initiatePayment(params: {
  uid: string;
  email: string;
  method: PaymentIntent["paymentMethod"];
  claimId?: string;
}): Promise<{ intent: PaymentIntent; paymentRecordId: string }> {
  const record = await createPaymentRecord({
    uid: params.uid,
    email: params.email,
    method: params.method,
    certificateClaimId: params.claimId,
  });

  const intent: PaymentIntent = {
    id: record.id,
    amount: CERTIFICATE_FEE,
    currency: "USD",
    description: `Seedwel Certificate - Incorporation Fee $${CERTIFICATE_FEE} - Verification & Issuance`,
    status: "pending",
    paymentMethod: params.method,
    created: Date.now(),
  };

  return { intent, paymentRecordId: record.id };
}

/**
 * Admin approves a payment. Updates payment record to "succeeded" and
 * marks the certificate claim as paid.
 */
export async function adminApprovePayment(params: {
  uid: string;
  paymentId: string;
  method: PaymentIntent["paymentMethod"];
  adminUid?: string;
}): Promise<CertificateClaim | null> {
  return approvePaymentByAdmin({
    uid: params.uid,
    paymentId: params.paymentId,
    method: params.method,
    adminUid: params.adminUid,
  });
}

/**
 * Admin rejects a payment. Updates payment record to "failed".
 * Certificate claim stays eligible so student can try again.
 */
export async function adminRejectPayment(params: {
  uid: string;
  paymentId: string;
  reason?: string;
}): Promise<void> {
  return rejectPaymentByAdmin({
    uid: params.uid,
    paymentId: params.paymentId,
    reason: params.reason,
  });
}

export function formatIncorporationDisclaimer(): string {
  return certificateIncorporationNote();
}

export { genCertificateNumber };
