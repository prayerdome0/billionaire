import { useState } from "react";
import { Download, FileText, CheckCircle, Sparkles } from "lucide-react";
import { generateBillionairePdf } from "../utils/generatePdf";

export default function DownloadSection() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateBillionairePdf();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 5000);
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  return (
    <section id="download" className="py-24 bg-gray-950 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/80 border border-amber-500/20 rounded-3xl p-8 md:p-14 text-center relative overflow-hidden">
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-br-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-tl-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-6">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">
                FREE PDF DOWNLOAD
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-white mb-5">
              Get Your Complete{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Billionaire Blueprint
              </span>
            </h2>

            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Download the full guide as a beautifully formatted PDF. Includes all 6 niches,
              18 billionaire case studies, strategies, and step-by-step getting started guides — plus a link to the full online curriculum.
            </p>

            {/* What's included */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-2xl mx-auto">
              {[
                "6 High-Paying Niches",
                "18 Case Studies",
                "28-Lesson Curriculum",
                "Video Masterclasses",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-10 py-5 rounded-2xl text-lg hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {downloaded ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Downloaded Successfully!
                </>
              ) : downloading ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  Generating Your PDF...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 group-hover:animate-bounce" />
                  Download PDF Guide (Free)
                </>
              )}
            </button>

            {downloaded && (
              <p className="text-amber-400 text-sm mt-4 animate-fade-in">
                ✨ Your Billionaire Blueprint has been downloaded! Check your downloads folder.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
