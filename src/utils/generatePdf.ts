import jsPDF from "jspdf";
import { niches, stepsToWealth, wealthPrinciples } from "../data/content";

export async function generateBillionairePdf(): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  const checkNewPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text: string, size: number, color: [number, number, number] = [17, 24, 39]) => {
    doc.setTextColor(...color);
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += size * 0.5 + 2;
  };

  const addBody = (text: string, size: number = 10) => {
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    checkNewPage(lines.length * 5 + 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
  };

  const addSeparator = () => {
    checkNewPage(10);
    doc.setDrawColor(209, 171, 82);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  // Cover Page
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 297, "F");

  // Gold accent line
  doc.setFillColor(209, 171, 82);
  doc.rect(margin, 40, contentWidth, 2, "F");

  doc.setTextColor(209, 171, 82);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("BILLIONAIRE", margin, 65);
  doc.text("BLUEPRINT", margin, 80);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("The Ultimate Guide to Building Extraordinary Wealth", margin, 95);

  doc.setFillColor(209, 171, 82);
  doc.rect(margin, 105, contentWidth, 1, "F");

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(11);
  doc.text("High-Paying Niches • Billionaire Examples • Actionable Strategies", margin, 118);

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 260);

  doc.setTextColor(209, 171, 82);
  doc.setFontSize(10);
  doc.text("www.billionaireblueprint.com", margin, 270);

  // Page 2: Steps to Becoming a Billionaire
  doc.addPage();
  y = 20;

  addTitle("HOW TO BECOME A BILLIONAIRE", 22, [209, 171, 82]);
  y += 3;
  addBody("Building extraordinary wealth requires a combination of mindset, strategy, timing, and relentless execution. Here are the six critical steps that every billionaire has followed in some form.");
  y += 3;

  stepsToWealth.forEach((step) => {
    checkNewPage(35);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y - 3, contentWidth, 28, 2, 2, "F");
    
    doc.setTextColor(209, 171, 82);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${step.number}`, margin + 5, y + 8);

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(step.title, margin + 18, y + 5);

    doc.setTextColor(75, 85, 99);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const stepLines = doc.splitTextToSize(step.description, contentWidth - 23);
    doc.text(stepLines.slice(0, 3), margin + 18, y + 12);

    y += 33;
  });

  // Wealth Principles Page
  doc.addPage();
  y = 20;
  addTitle("CORE WEALTH PRINCIPLES", 22, [209, 171, 82]);
  y += 3;

  wealthPrinciples.forEach((principle) => {
    checkNewPage(30);
    
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`★ ${principle.title}`, margin, y);
    y += 6;

    addBody(principle.description, 9);
    y += 3;
  });

  // Niche Pages
  niches.forEach((niche) => {
    doc.addPage();
    y = 20;

    // Niche header
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, 210, 45, "F");
    doc.setFillColor(209, 171, 82);
    doc.rect(margin, 38, 60, 2, "F");

    doc.setTextColor(209, 171, 82);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("HIGH-PAYING NICHE", margin, 15);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(niche.title.toUpperCase(), margin, 30);

    y = 55;

    doc.setTextColor(209, 171, 82);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Potential Earnings: ${niche.potentialEarnings}`, margin, y);
    y += 8;

    addBody(niche.description);
    y += 2;

    // Why it's high paying
    checkNewPage(20);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Why This Niche Pays So Well", margin, y);
    y += 7;
    addBody(niche.whyHighPaying, 9);
    y += 3;

    // Strategies
    checkNewPage(20);
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Key Strategies", margin, y);
    y += 7;

    niche.strategies.forEach((strategy) => {
      checkNewPage(8);
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`▸ ${strategy}`, margin + 3, y);
      y += 5;
    });
    y += 3;

    // Examples
    niche.examples.forEach((example) => {
      checkNewPage(40);
      addSeparator();

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(example.name, margin, y);

      doc.setTextColor(209, 171, 82);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`Net Worth: ${example.netWorth}`, pageWidth - margin - 50, y);
      y += 6;

      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(example.company, margin, y);
      y += 6;

      addBody(example.story, 9);
      y += 2;
    });

    // Getting Started
    checkNewPage(35);
    addSeparator();
    doc.setTextColor(17, 24, 39);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("How to Get Started", margin, y);
    y += 7;

    niche.gettingStarted.forEach((step, i) => {
      checkNewPage(8);
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}. ${step}`, margin + 3, y);
      y += 5;
    });
  });

  // Final Page
  doc.addPage();
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(209, 171, 82);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("YOUR JOURNEY", pageWidth / 2, 100, { align: "center" });
  doc.text("STARTS NOW", pageWidth / 2, 115, { align: "center" });

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  const closingText = doc.splitTextToSize(
    "The difference between those who dream of billions and those who achieve it is simple: action. Pick your niche, study the examples, follow the strategies, and execute with unwavering determination. Your billionaire blueprint is in your hands.",
    contentWidth
  );
  doc.text(closingText, pageWidth / 2, 135, { align: "center" });

  doc.setTextColor(209, 171, 82);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text('"The best time to start was yesterday.', pageWidth / 2, 175, { align: "center" });
  doc.text('The second best time is NOW."', pageWidth / 2, 188, { align: "center" });

  doc.save("Billionaire_Blueprint_Guide.pdf");
}
