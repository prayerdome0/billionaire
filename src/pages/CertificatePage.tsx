import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Download,
  Loader2,
  Lock,
  Medal,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  CreditCard,
  Wallet,
  Smartphone,
  CheckCircle2,
  Building2,
  Info,
  BadgeCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";
import { fetchLessons, fetchProgress } from "../lib/api";
import {
  getCertificateStatus,
  createOrUpdateCertificateClaim,
  type CertificateClaim,
} from "../lib/firestoreDb";
import {
  initiatePayment,
  finalizeCertificateAfterPayment,
  CERTIFICATE_FEE,
  INCORPORATION_MESSAGE,
  type PaymentIntent,
} from "../lib/certificateService";
import { generateCertificate } from "../utils/generateCertificate";

type PaymentMethod = "card" | "paypal" | "mobile_money";

export default function CertificatePage() {
  const { user, profile, firestoreUser } = useAuth();
  const uid = user?.uid || "";
  const email = profile?.email || user?.email || "";

  const [completed, setCompleted] = useState<string[]>([]);
  const [total, setTotal] = useState(28);
  const [name, setName] = useState(
    () => localStorage.getItem("bb_cert_name") || profile?.name || user?.displayName || ""
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // certificate & payment state
  const [claim, setClaim] = useState<CertificateClaim | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [paying, setPaying] = useState(false);
  const [payStatus, setPayStatus] = useState<"idle" | "requires_payment" | "processing" | "paid" | "failed">("idle");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [prog, lessons] = await Promise.all([fetchProgress(), fetchLessons()]);
        if (!mounted) return;
        setCompleted(prog);
        setTotal(lessons.length);

        // Firestore certificate status (true DB)
        if (uid) {
          const cert = await getCertificateStatus(uid);
          if (cert) setClaim(cert);
          if (cert?.paid) setPayStatus("paid");
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  useEffect(() => {
    setName((cur) => (cur.trim() ? cur : profile?.name || user?.displayName || ""));
  }, [profile, user]);

  // keep Firestore claim in sync when progress changes
  useEffect(() => {
    if (!uid || !email || !completed.length) return;
    createOrUpdateCertificateClaim({
      uid,
      email,
      nameOnCertificate: name || profile?.name || user?.displayName || email.split("@")[0],
      completed: completed.length,
      total,
    })
      .then(setClaim)
      .catch(() => {});
  }, [uid, email, completed.length, total]); // eslint-disable-line

  const pct = total ? Math.round((completed.length / total) * 100) : 0;
  const eligible = completed.length >= total && total > 0;

  const handleName = (v: string) => {
    setName(v);
    localStorage.setItem("bb_cert_name", v);
  };

  const handlePay = async () => {
    if (!uid || !email) return;
    setError("");
    setPaying(true);
    setPayStatus("processing");
    try {
      const { intent, paymentRecordId } = await initiatePayment({
        uid,
        email,
        method: paymentMethod,
        claimId: claim?.id,
      });
      setPaymentIntent(intent);

      // simulate processing
      const finalClaim = await finalizeCertificateAfterPayment({
        uid,
        paymentId: paymentRecordId,
        method: paymentMethod,
      });

      if (finalClaim) setClaim(finalClaim);
      setPayStatus("paid");
    } catch (e) {
      setPayStatus("failed");
      setError(e instanceof Error ? e.message : "Payment failed. Try again.");
    } finally {
      setPaying(false);
    }
  };

  const download = async () => {
    if (!eligible || !name.trim()) return;
    if (claim && !claim.paid) {
      setError(`Certificate fee $${CERTIFICATE_FEE} USD must be paid before download. Tuition is free, certificate is paid.`);
      return;
    }
    setGenerating(true);
    setError("");
    try {
      await generateCertificate(name, completed.length, total, pct);
      // update issuedAt if needed
      if (uid) {
        await createOrUpdateCertificateClaim({
          uid,
          email,
          nameOnCertificate: name,
          completed: completed.length,
          total,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate certificate.");
    } finally {
      setGenerating(false);
    }
  };

  const isPaid = claim?.paid || payStatus === "paid";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Achievement • Certificate Incorporation"
        title="Your Certificate of"
        highlight="Completion"
        description={`Tuition is FREE worldwide. Official certificate issuance is a paid service: $${CERTIFICATE_FEE} USD per claim. We are a certificate incorporation entity registered 2025 — we have not built any physical school yet.`}
      />

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          {/* Incorporation banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-8 flex gap-4">
            <Building2 className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <BadgeCheck className="w-4 h-4" /> Certificate Incorporation • Est. 2025
              </div>
              <p className="text-amber-200/70 text-xs leading-relaxed mt-1">
                {INCORPORATION_MESSAGE} Your tuition remains $0 — you only pay ${CERTIFICATE_FEE} USD if you choose to claim the official verified certificate PDF.
              </p>
              <p className="text-[11px] text-gray-500 mt-2">
                Role detected:{" "}
                <span className={`font-bold ${firestoreUser?.role === "admin" ? "text-amber-400" : "text-emerald-300"}`}>
                  {firestoreUser?.role || profile?.role || "student"} {firestoreUser?.role === "admin" ? "(Admin — Firebase role)" : ""}
                </span>{" "}
                • Firebase UID: {uid ? `${uid.slice(0, 10)}…` : "—"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
                {eligible ? <Medal className="w-4 h-4 text-amber-400" /> : <TrendingUp className="w-4 h-4 text-amber-400" />}
                Progress toward certification — tuition free
              </span>
              <span className="text-amber-400 font-bold">
                {completed.length}/{total} lessons · {pct}%
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            {eligible && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Eligible for certificate — pay ${CERTIFICATE_FEE} to claim</span>
              </div>
            )}
          </div>

          {!eligible && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center mb-8">
              <Lock className="w-10 h-10 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Certificate locked</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Finish all {total} lessons ({total - completed.length} remaining) to unlock your certificate. Tuition is free — your progress is saved to Firebase Firestore (true database) as you complete lessons.
              </p>
              <Link
                to="/lessons"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                Continue Learning (Free)
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
                    <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="h-16 w-auto object-contain" />
                  </div>
                  <div className="text-[#d1ab52] font-bold tracking-[0.3em] text-xs md:text-sm mb-2">SEEDWEL INVESTMENT LIMITED • BILLIONAIRE BLUEPRINT</div>
                  <h2 className="text-2xl md:text-4xl font-black text-white mb-2">Certificate of Completion</h2>
                  <div className="w-24 h-px bg-[#d1ab52] mx-auto my-5" />
                  <p className="text-gray-400 text-sm">This certificate is proudly awarded to</p>
                  <p className="text-[#d1ab52] font-bold text-2xl md:text-4xl my-3">{name.trim() || "Your Name"}</p>
                  <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
                    for completing {completed.length} of {total} in-depth lessons ({pct}% of the curriculum) across all six modules of the Billionaire Blueprint wealth program.
                  </p>
                  <p className="text-gray-500 text-xs mt-3">Tuition Model: FREE • Certificate Fee: ${CERTIFICATE_FEE} USD • Incorporation Entity • No physical school built yet</p>
                  <p className="text-gray-500 text-xs mt-2">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <div className="flex justify-between items-end mt-8 text-gray-400 text-xs">
                    <div className="text-center">
                      <div className="w-40 border-t border-[#d1ab52] pt-2">The Founders</div>
                    </div>
                    <div className="text-center">
                      <Award className="w-8 h-8 text-[#d1ab52] mx-auto mb-1" />
                      <div className="w-40 border-t border-[#d1ab52] pt-2">
                        Verified in Firestore • {claim?.certificateNumber || "SWL-XXXX-XXXX"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee structure explain */}
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 mb-8">
                <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-sky-400" /> Fee Structure — Transparent
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                    <div className="text-emerald-300 font-bold">Tuition</div>
                    <div className="text-2xl font-black text-white mt-1">$0</div>
                    <div className="text-xs text-emerald-200/60 mt-1">FREE forever — all 28 lessons, quizzes, videos, progress tracking in Firebase.</div>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
                    <div className="text-amber-300 font-bold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" /> Certificate Claim
                    </div>
                    <div className="text-2xl font-black text-white mt-1">${CERTIFICATE_FEE}</div>
                    <div className="text-xs text-amber-200/60 mt-1">One-time fee for verified PDF, registry entry, anti-forgery ID, incorporation admin.</div>
                  </div>
                  <div className="rounded-xl bg-gray-800/60 border border-gray-700 p-4">
                    <div className="text-gray-300 font-bold">Physical School</div>
                    <div className="text-sm font-bold text-white mt-1">Not built yet</div>
                    <div className="text-xs text-gray-500 mt-1">We operate as certificate incorporation (2025). No brick-and-mortar campus yet.</div>
                  </div>
                </div>
              </div>

              {/* Payment + name + download */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name on certificate (Firebase verified)</label>
                <input
                  value={name}
                  onChange={(e) => handleName(e.target.value)}
                  placeholder="Enter the name to appear on your certificate"
                  className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors mb-6"
                />

                {!isPaid ? (
                  <>
                    <div className="mb-6">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Choose payment method — ${CERTIFICATE_FEE} USD</div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "card", label: "Card", icon: CreditCard },
                          { id: "paypal", label: "PayPal", icon: Wallet },
                          { id: "mobile_money", label: "MoMo", icon: Smartphone },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${
                              paymentMethod === m.id
                                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                                : "bg-gray-950/60 border-gray-800 text-gray-400 hover:border-amber-500/30"
                            }`}
                          >
                            <m.icon className="w-5 h-5" />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>
                    )}

                    <button
                      onClick={handlePay}
                      disabled={paying || !name.trim()}
                      className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-4 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-40 shadow-lg shadow-emerald-500/20"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing ${CERTIFICATE_FEE} Payment…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" /> Pay ${CERTIFICATE_FEE} USD & Claim Certificate
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-gray-500 mt-3 text-center">
                      Secure payment simulated (replace with Stripe/PayPal in production). Tuition stays FREE — certificate fee covers verification & incorporation registry stored in Firestore true database.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-emerald-300 font-bold text-sm">Paid — Certificate Unlocked</div>
                        <div className="text-emerald-200/60 text-xs mt-1">
                          Payment ID: <code className="font-mono text-emerald-300">{claim?.paymentId || paymentIntent?.id}</code> • Certificate:{" "}
                          <code className="font-mono text-amber-300">{claim?.certificateNumber}</code> • Method: {claim?.paymentMethod || paymentMethod} • Firestore verified.
                        </div>
                      </div>
                    </div>

                    {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
                    <button
                      onClick={download}
                      disabled={generating || !name.trim()}
                      className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20"
                    >
                      {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      {generating ? "Generating PDF..." : "Download Certificate (PDF) — Firebase Verified"}
                    </button>
                    <p className="text-[11px] text-gray-500 mt-3 text-center">
                      Firestore collection <code className="text-amber-500/70">certificates/{claim?.uid}</code> • incorporation note included in PDF metadata.
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
