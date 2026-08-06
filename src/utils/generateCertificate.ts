import { jsPDF } from "jspdf";

/**
 * Generates a styled "Certificate of Completion" PDF for the
 * Billionaire Blueprint curriculum using jsPDF (A4 landscape).
 */
export async function generateCertificate(
  studentName: string,
  completedCount: number,
  totalCount: number,
  pct: number
): Promise<void> {
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
  doc.setFontSize(11);
  doc.text("BILLIONAIRE BLUEPRINT", W / 2, 42, { align: "center" });

  doc.setTextColor(textLight.r, textLight.g, textLight.b);
  doc.setFontSize(34);
  doc.text("Certificate of Completion", W / 2, 62, { align: "center" });

  // Gold divider
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.8);
  doc.line(W / 2 - 45, 70, W / 2 + 45, 70);

  // Awarded to
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text("This certificate is proudly awarded to", W / 2, 88, { align: "center" });

  // Name
  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  const safeName = studentName.trim().slice(0, 40) || "Student";
  doc.text(safeName, W / 2, 104, { align: "center" });

  // Body
  doc.setTextColor(textLight.r, textLight.g, textLight.b);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const body = `for completing ${completedCount} of ${totalCount} in-depth lessons (${pct}% of the curriculum)\nacross all six modules of the Billionaire Blueprint wealth program.`;
  doc.text(doc.splitTextToSize(body, 210), W / 2, 122, { align: "center" });

  // Date
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFontSize(11);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(dateStr, W / 2, 152, { align: "center" });

  // Signature line
  doc.setDrawColor(gold.r, gold.g, gold.b);
  doc.setLineWidth(0.5);
  doc.line(70, 172, 130, 172);
  doc.line(167, 172, 227, 172);
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.setFontSize(10);
  doc.text("The Billionaire Blueprint Founders", 100, 178, { align: "center" });
  doc.text("Verified by the completion database", 197, 178, { align: "center" });

  // Serial
  doc.setFontSize(9);
  const serial = `BB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.abs(hashCode(safeName)) % 100000}`;
  doc.text(`Certificate № ${serial}`, W / 2, 192, { align: "center" });

  const file = `Billionaire-Blueprint-Certificate-${safeName.replace(/[^a-zA-Z0-9]+/g, "-")}.pdf`;
  doc.save(file);
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
