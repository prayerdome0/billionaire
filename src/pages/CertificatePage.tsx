import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Download, Loader2, Lock, Medal, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { fetchLessons, fetchProgress, getClientId } from "../lib/api";
import { generateCertificate } from "../utils/generateCertificate";

export default function CertificatePage() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [total, setTotal] = useState(28);
  const [name, setName] = useState(() => localStorage.getItem("bb_cert_name") || "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [prog, lessons] = await Promise.all([
          fetchProgress(getClientId()),
          fetchLessons(),
        ]);
        if (!mounted) return;
        setCompleted(prog);
        setTotal(lessons.length);
      } finally {
        if (!mounted) return;
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const pct = total ? Math.round((completed.length / total) * 100) : 0;
  const eligible = completed.length >= total;

  const handleName = (v: string) => {
    setName(v);
    localStorage.setItem("bb_cert_name", v);
  };

  const download = async () => {
    if (!eligible || !name.trim()) return;
    setGenerating(true);
    setError("");
    try {
      await generateCertificate(name, completed.length, total, pct);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate certificate.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Achievement"
        title="Your Certificate of"
        highlight="Completion"
        description="Complete all 28 lessons — including passing the quiz in each one — to unlock your official, downloadable Billionaire Blueprint certificate."
      />

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          {/* Progress */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
                {eligible ? <Medal className="w-4 h-4 text-amber-400" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
                Progress toward certification
              </span>
              <span className="text-amber-400 font-bold">{completed.length}/{total} lessons · {pct}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {!eligible && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center mb-8">
              <Lock className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Certificate locked</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Finish all {total} lessons ({total - completed.length} remaining) to unlock your certificate.
                Your progress is saved automatically as you complete lessons and pass quizzes.
              </p>
              <Link
                to="/lessons"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                Continue Learning
              </Link>
            </div>
          )}

          {eligible && (
            <>
              {/* Certificate preview */}
              <div className="relative bg-[#111827] border-4 border-[#d1ab52] rounded-lg p-6 md:p-10 mb-8 shadow-2xl shadow-amber-500/10">
                <div className="absolute inset-2 border border-[#d1ab52]/60 rounded" />
                <div className="relative text-center">
                  <div className="flex justify-center mb-3">
                    <img
                      src="/images/seedwel-logo.svg"
                      alt="Seedwel Investment Limited"
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                  <div className="text-[#d1ab52] font-bold tracking-[0.3em] text-xs md:text-sm mb-2">
                    SEEDWEL INVESTMENT LIMITED • BILLIONAIRE BLUEPRINT
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-white mb-2">
                    Certificate of Completion
                  </h2>
                  <div className="w-24 h-px bg-[#d1ab52] mx-auto my-5" />
                  <p className="text-gray-400 text-sm">This certificate is proudly awarded to</p>
                  <p className="text-[#d1ab52] font-bold text-2xl md:text-4xl my-3">
                    {name.trim() || "Your Name"}
                  </p>
                  <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
                    for completing {completed.length} of {total} in-depth lessons ({pct}% of the curriculum)
                    across all six modules of the Billionaire Blueprint wealth program.
                  </p>
                  <p className="text-gray-500 text-xs mt-6">
                    {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <div className="flex justify-between items-end mt-8 text-gray-400 text-xs">
                    <div className="text-center">
                      <div className="w-40 border-t border-[#d1ab52] pt-2">The Founders</div>
                    </div>
                    <div className="text-center">
                      <Award className="w-8 h-8 text-[#d1ab52] mx-auto mb-1" />
                      <div className="w-40 border-t border-[#d1ab52] pt-2">Verified by the DB</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name + download */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Name on certificate
                </label>
                <input
                  value={name}
                  onChange={(e) => handleName(e.target.value)}
                  placeholder="Enter the name to appear on your certificate"
                  className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors mb-6"
                />
                {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
                <button
                  onClick={download}
                  disabled={generating || !name.trim()}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {generating ? "Generating PDF..." : "Download Certificate (PDF)"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
