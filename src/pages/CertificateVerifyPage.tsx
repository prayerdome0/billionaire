import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, Search, Loader2, Award, Calendar, BookOpen, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCertificateByNumberFirestore } from "../lib/firestoreDb";
import { formatIncorporationDisclaimer } from "../lib/certificateService";

export default function CertificateVerifyPage() {
  const { certNumber: paramCertNumber } = useParams<{ certNumber?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCertNumber = searchParams.get("number") || "";

  const [certNumber, setCertNumber] = useState(paramCertNumber || queryCertNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const activeNum = paramCertNumber || queryCertNumber;
    if (activeNum) {
      setCertNumber(activeNum);
      handleVerify(activeNum);
    }
  }, [paramCertNumber, queryCertNumber]);

  const handleVerify = async (numToVerify?: string) => {
    const target = (numToVerify || certNumber).trim();
    if (!target) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);

    try {
      const claim = await getCertificateByNumberFirestore(target);
      if (claim) {
        if (claim.paid || claim.paymentStatus === "paid") {
          setResult(claim);
        } else {
          setError("This certificate registry exists, but is unpaid/unclaimed. Completed certificates must be verified with payment of the $5 registry fee.");
        }
      } else {
        setError("No official certificate registry found matching that certificate number. Please verify the spelling and formatting (e.g. SWL-YYYYMMDD-XXXXX).");
      }
    } catch (err) {
      setError("An error occurred while looking up the certificate on the Firebase database.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certNumber.trim()) return;
    setSearchParams({ number: certNumber.trim() });
    handleVerify(certNumber);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
      <Navbar />

      <div className="max-w-4xl w-full mx-auto px-4 py-24 grow flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white">Seedwel Anti-Forgery Registry</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
            Verify official student certificate credentials issued by Seedwel Investment Limited. All records are cryptographically registered on the real Firebase database.
          </p>
        </div>

        {/* Search bar */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6 shadow-2xl mb-8">
          <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative grow">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="Enter Certificate Number (e.g., SWL-20251120-ABCDE)"
                className="w-full bg-gray-950/85 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors uppercase font-mono tracking-wider"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !certNumber.trim()}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-8 py-4 rounded-2xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              Verify Status
            </button>
          </form>
        </div>

        {/* Results section */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-2" />
            <p className="text-gray-400 text-sm font-medium">Consulting Firebase True Database Registry…</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex gap-4 items-start text-left">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-300">Verification Unsuccessful</h3>
              <p className="text-rose-200/80 text-sm mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {!loading && result && (
          <div className="bg-gray-900/60 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-left">
            {/* Dynamic visual design for verified cert */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none animate-pulse" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800/80 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Official Registry Status: VERIFIED
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">Authentic Seedwel Credential</h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-gray-500 font-semibold block">Registry Date</span>
                <span className="text-gray-300 font-mono text-xs">{result.claimedAt ? new Date(result.claimedAt?.seconds * 1000 || result.claimedAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block">Student Name</span>
                  <span className="text-xl font-black text-amber-300">{result.nameOnCertificate}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block">Program / Course</span>
                  <span className="text-sm font-semibold text-white">Seedwel Billionaire Blueprint Wealth Platform</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider block">Registry ID</span>
                  <span className="text-xs font-mono text-emerald-400 block break-all">{result.certificateNumber}</span>
                </div>
              </div>

              <div className="space-y-4 bg-gray-950/50 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Academic Progress Metrics</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Total Lessons Completed
                    </span>
                    <span className="font-bold text-white font-mono">{result.completedLessons}/{result.totalLessons}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> Certification Percentile
                    </span>
                    <span className="font-bold text-amber-400 font-mono">{result.percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Registry Verification Fee
                    </span>
                    <span className="font-bold text-emerald-400">$5.00 USD (Paid)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-800/80 bg-gray-950/20 rounded-xl">
              <span className="text-[10px] uppercase text-amber-400 font-bold tracking-wider block mb-1">
                ⚠️ Legal Incorporation & Education Structure Note
              </span>
              <p className="text-[11px] text-gray-500 leading-relaxed italic">
                {formatIncorporationDisclaimer()}
              </p>
            </div>
          </div>
        )}

        {searched && !loading && !result && !error && (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 text-center text-gray-500 text-sm">
            Please search for a certificate number using the input above.
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
