/**
 * Certificate Service — $5 paid claim, tuition FREE, incorporation model
 *
 * Business rules (from user):
 * - Tuition is FREE for everyone.
 * - Certificate is $5 to claim (paid) — verification, anti-forgery, incorporation admin fee.
 * - We have NOT built any physical school; we are a Certificate Incorporation entity registered 2025.
 * - Admin role is stored in Firebase users/{uid} with role field.
 *
 * Payment methods: card (Stripe-like), PayPal, mobile money, manual verification by admin.
 */

import { CERTIFICATE_FEE_USD } from "./firebase";
import {
  getCertificateStatus,
  createOrUpdateCertificateClaim,
  markCertificatePaid,
  createPaymentRecord,
  confirmPaymentRecord,
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
  "Official certificate issuance, verification registry, and incorporation administrative handling is a paid service at $5 per certificate.";

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: "requires_payment" | "processing" | "succeeded" | "failed";
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
    status: "requires_payment",
    paymentMethod: params.method,
    created: Date.now(),
  };

  return { intent, paymentRecordId: record.id };
}

/**
 * Simulate payment processing.
 * In production, replace with Stripe Checkout / PayPal SDK / Mobile Money API.
 * For now: 2-second delay then success.
 */
export async function processMockPayment(paymentId: string, method: PaymentIntent["paymentMethod"]): Promise<{ success: boolean; transactionId: string }> {
  // simulate network
  await new Promise((r) => setTimeout(r, 1800));

  // 95% success rate mock
  const success = Math.random() > 0.05;
  const txId = `txn_${method}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await confirmPaymentRecord(paymentId, success);

  return { success, transactionId: success ? txId : "" };
}

export async function finalizeCertificateAfterPayment(params: { uid: string; paymentId: string; method: PaymentIntent["paymentMethod"] }): Promise<CertificateClaim | null> {
  const proc = await processMockPayment(params.paymentId, params.method);
  if (!proc.success) throw new Error("Payment failed — please try again or contact support.");

  const claim = await markCertificatePaid({
    uid: params.uid,
    paymentId: proc.transactionId,
    method: params.method,
  });
  return claim;
}

export function formatIncorporationDisclaimer(): string {
  return certificateIncorporationNote();
}

export { genCertificateNumber };
