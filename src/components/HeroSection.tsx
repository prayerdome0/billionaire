import { useState } from "react";
import { ChevronDown, Download, Sparkles } from "lucide-react";
import { generateBillionairePdf } from "../utils/generatePdf";

export default function HeroSection() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateBillionairePdf();
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/36945570/pexels-photo-36945570.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
          alt="Luxury mansion"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950/95" />
      </div>

      {/* Animated particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-400/20 animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 mb-8">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-xs md:text-sm font-bold tracking-wider uppercase">
            SEEDWEL INVESTMENT LIMITED • REGISTERED 2025 • OPEN FOR INVESTORS
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
          BILLIONAIRE{" "}
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            BLUEPRINT
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
          Led by Founder &amp; CEO <strong className="text-white">Mr. Seedwell Khayalethu Masuku</strong> and Zambia Country Director{" "}
          <strong className="text-white">Zacheus Simbaya</strong>. We invite investors into school building infrastructure &amp; AI business developer ecosystems, alongside our 28-lesson wealth curriculum.
        </p>

        <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-10">
          Officially registered last year (2025). High-yield school construction projects in Zambia, AI developer incubators, and full executive admin portal (<code className="text-amber-400 font-mono">seed@admin</code>).
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#steps"
            className="group bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            Start Your Journey
          </a>
          <a
            href="/founders#invest"
            className="group flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300 hover:scale-105"
          >
            Invest With Seedwel
          </a>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="group flex items-center gap-3 bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 disabled:opacity-50 hover:scale-105"
          >
            <Download className="w-5 h-5 text-amber-400 group-hover:animate-bounce" />
            {downloading ? "Generating PDF..." : "Download Full PDF Guide"}
          </button>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">2025</div>
            <div className="text-xs text-gray-500 mt-1">Officially Registered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">15 Schools</div>
            <div className="text-xs text-gray-500 mt-1">Zambia Construction Phase 1</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">AI &amp; Devs</div>
            <div className="text-xs text-gray-500 mt-1">Software Incubator Fund</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">28</div>
            <div className="text-xs text-gray-500 mt-1">Wealth Curriculum Lessons</div>
          </div>
        </div>
      </div>

      <a
        href="#steps"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 hover:text-amber-400 transition-colors animate-bounce"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
}
