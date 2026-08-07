import { jsPDF } from "jspdf";

/**
 * Generates a styled "Certificate of Completion" PDF for the
 * Billionaire Blueprint curriculum using jsPDF (A4 landscape).
 *
 * BUSINESS MODEL:
 * - Tuition FREE ($0) — all 28 lessons accessible free
 * - Certificate $5 paid — verification, incorporation registry, anti-forgery
 * - Incorporation: Seedwel Investment Limited — Certificate Incorporation entity registered 2025, no physical school built yet
 * - True database: Firebase Firestore
 * - Admin role: users/{uid} role field
 */

export interface GeneratedCertificate {
  blob: Blob;
  fileName: string;
  serial: string;
}

/**
 * Generates the PDF and returns the blob + serial so callers can also push it
 * to Cloudinary for a hosted copy, then trigger the browser download.
 */
export async function generateCertificate(
  studentName: string,
  completedCount: number,
  totalCount: number,
  pct: number
): Promise<GeneratedCertificate> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  const gold = { r: 209, g: 171, b: 82 };
  const dark = { r: 17, g: 24, b: 39 };
  const textLight = { r: 240, g: 240, b: 240 };
  const textMuted = { r: 156, g: 163, b: 175 };

  // Background
  doc.setFillColor(dark.r, dark.g, dark.b);
  doc.rect(0, 0, W, H, "F");

  // Double gold border
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, W - 20, H - 20, "S");
  doc.setLineWidth(0.5);
  doc.rect(14, 14, W - 28, H - 28, "S");

  // Corner accents
  doc.setFillColor(gold.r, gold.g, gold.b);
  doc.rect(10, 10, 24, 2.4, "F");
  doc.rect(10, 10, 2.4, 24, "F");
  doc.rect(W - 34, 10, 24, 2.4, "F");
  doc.rect(W - 12.4, 10, 2.4, 24, "F");
  doc.rect(10, H - 12.4, 24, 2.4, "F");
  doc.rect(10, H - 34, 2.4, 24, "F");
  doc.rect(W - 34, H - 12.4, 24, 2.4, "F");
  doc.rect(W - 12.4, H - 34, 2.4, 24, "F");

  // Headline
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SEEDWEL INVESTMENT LIMITED • CERTIFICATE OF INCORPORATION • EST. 2025", W / 2, 28, { align: "center" });

  doc.setFontSize(11);
  doc.text("Awarded in Recognition of Successful Completion of the Billionaire Blueprint Program", W / 2, 38, { align: "center" });

  doc.setTextColor(textLight.r, textLight.g, textLight.b);
  doc.setFontSize(34);
  doc.text("Certificate of Completion", W / 2, 56, { align: "center" });

  // Gold divider
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 45, 64, W / 2 + 45, 64);

  // Awarded to
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("This certificate is proudly awarded to", W / 2, 80, { align: "center" });

  // Name
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  const safeName = studentName.trim().slice(0, 40) || "Student";
  doc.text(safeName, W / 2, 96, { align: "center" });

  // Body
  doc.setTextColor(textLight.r, textLight.g, textLight.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const body = `for successfully completing all ${totalCount} in-depth lessons (${pct}% of the curriculum) across all six modules of the Billionaire Blueprint wealth program.`;
  doc.text(doc.splitTextToSize(body, 210), W / 2, 110, { align: "center" });

  // Date
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(dateStr, W / 2, 144, { align: "center" });

  // Signature line
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.5);
  doc.line(60, 164, 120, 164);
  doc.line(177, 164, 237, 164);
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFontSize(9);
  doc.text("Founder / Director — Seedwell Masuku", 90, 170, { align: "center" });
  doc.text("Certificate Verification Available Online", 207, 170, { align: "center" });

  doc.setFontSize(8);
  doc.text("Certificate ID: SWL-20260807-25653-3964 • Verification URL: https://seedwel.com/verify", W / 2, 178, { align: "center" });

  // Serial + Firestore reference
  doc.setFontSize(9);
  const serial = `SWL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.abs(hashCode(safeName)) % 100000}-${Math.floor(Math.random() * 9000) + 1000}`;
  doc.text(`Verification ID: SWL-20260807-25653-3964 • Certificate ID: ${serial}`, W / 2, 190, { align: "center" });

  const file = `Seedwel-Certificate-${safeName.replace(/[^a-zA-Z0-9]+/g, "-")}-${serial}.pdf`;
  doc.save(file);

  // Return blob + serial so the UI can upload a hosted copy to Cloudinary.
  const blob = doc.output("blob");
  return { blob, fileName: file, serial };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
