/**
 * Certificate service — student quotation request + manual admin delivery.
 *
 * Business rules:
 * - Tuition is FREE for everyone.
 * - A verified certificate costs $5 USD.
 * - The student sends a payment quotation/request to the admin; this page does
 *   not charge a card or pretend that a payment processor has run.
 * - After verifying payment, an administrator sends the certificate to the
 *   student's registered email within 48 hours and records that delivery.
 */

import { CERTIFICATE_FEE_USD } from "./firebase";
import {
  getCertificateStatus,
  createOrUpdateCertificateClaim,
  submitCertificateQuotation,
  markCertificateSentByAdmin,
  rejectPaymentByAdmin,
  certificateIncorporationNote,
  genCertificateNumber,
  CERTIFICATE_DELIVERY_WINDOW_HOURS,
  type CertificateClaim,
} from "./firestoreDb";

export const CERTIFICATE_FEE = CERTIFICATE_FEE_USD;
export const TUITION_FREE = true;
export const CERTIFICATE_DELIVERY_HOURS = CERTIFICATE_DELIVERY_WINDOW_HOURS;
export const INCORPORATION_MESSAGE =
  "Seedwel Investment Limited is a Certificate Incorporation entity registered in 2025. " +
  "We have NOT built any physical school structure yet. " +
  "We provide educational curriculum FREE of charge (tuition = $0). " +
  "Official certificate issuance, verification registry, and incorporation administrative handling is a paid service at $5 per certificate. " +
  "Students send a payment quotation to the admin; after payment is verified, the admin sends the certificate within 48 hours.";

export type CertificatePaymentMethod = "card" | "paypal" | "mobile_money" | "manual";

/**
 * Kept as a compact UI-friendly representation of the submitted quotation.
 * `pending` means the request is with the administrator; it does NOT mean a
 * card charge was completed in the browser.
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: "requires_payment" | "pending" | "processing" | "succeeded" | "failed";
  paymentMethod: CertificatePaymentMethod;
  created: number;
  quotationNumber?: string;
  deliveryWindowHours?: number;
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
 * Sends the student's $5 payment quotation and certificate request to the
 * Firestore admin queue. The certificate claim and payment-request record are
 * written in one Firestore batch, so we never call updateDoc on a missing
 * certificates/{uid} document.
 */
export async function sendCertificateQuotationToAdmin(params: {
  claim: CertificateClaim;
  method: CertificatePaymentMethod;
}): Promise<{ intent: PaymentIntent; paymentRecordId: string; claim: CertificateClaim }> {
  const submitted = await submitCertificateQuotation({
    claim: params.claim,
    method: params.method,
  });

  const intent: PaymentIntent = {
    id: submitted.payment.id,
    amount: CERTIFICATE_FEE,
    currency: "USD",
    description: `Seedwel Certificate — $${CERTIFICATE_FEE} USD payment quotation and delivery request`,
    status: "pending",
    paymentMethod: params.method,
    created: Date.now(),
    quotationNumber: submitted.payment.quotationNumber,
    deliveryWindowHours: submitted.payment.deliveryWindowHours || CERTIFICATE_DELIVERY_WINDOW_HOURS,
  };

  return { intent, paymentRecordId: submitted.payment.id, claim: submitted.claim };
}

/**
 * Backwards-compatible alias for earlier callers. It now submits a quotation
 * to the admin rather than simulating a charge in the browser.
 */
export async function initiatePayment(params: {
  uid: string;
  email: string;
  method: CertificatePaymentMethod;
  claimId?: string;
}): Promise<{ intent: PaymentIntent; paymentRecordId: string; claim: CertificateClaim }> {
  const claim = await getCertificateStatus(params.uid);
  if (!claim) {
    throw new Error("Your certificate request is not ready yet. Please save the certificate name and try again.");
  }
  return sendCertificateQuotationToAdmin({ claim, method: params.method });
}

/**
 * Admin confirms that payment was verified and that the certificate was sent
 * through the official delivery channel. This records delivery; email itself
 * is deliberately handled by the administrator's mail service.
 */
export async function adminMarkCertificateSent(params: {
  uid: string;
  paymentId: string;
  method: CertificatePaymentMethod;
  adminUid?: string;
  deliveryNote?: string;
}): Promise<CertificateClaim | null> {
  return markCertificateSentByAdmin(params);
}

/** Backwards-compatible name for existing integrations. */
export async function adminApprovePayment(params: {
  uid: string;
  paymentId: string;
  method: CertificatePaymentMethod;
  adminUid?: string;
}): Promise<CertificateClaim | null> {
  return adminMarkCertificateSent(params);
}

/**
 * Admin rejects a payment quotation. The claim returns to an eligible state so
 * the student can submit another request.
 */
export async function adminRejectPayment(params: {
  uid: string;
  paymentId: string;
  reason?: string;
}): Promise<void> {
  return rejectPaymentByAdmin(params);
}

export function formatIncorporationDisclaimer(): string {
  return certificateIncorporationNote();
}

export { genCertificateNumber };
