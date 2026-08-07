import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Landmark,
  Loader2,
  Lock,
  Medal,
  Receipt,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";
import { fetchLessons, fetchProgress } from "../lib/api";
import {
  CERT_PRICE_USD,
  createCertificateOrder,
  getCertificate,
  markCertificateClaimed,
  payCertificate,
  type CertificateRecord,
} from "../lib/firestore";
import { generateCertificate } from "../utils/generateCertificate";

type CheckoutMode = "card" | "manual";

export default function CertificatePage() {
  const { user, profile } = useAuth();
  const uid = profile?.uid || user?.uid || "";
  const email = profile?.email || user?.email || "";

  const [completed, setCompleted] = useState<string[]>([]);
  const [total, setTotal] = useState(28);
  const [record, setRecord] = useState<CertificateRecord | null>(null);
  const [registryLoading, setRegistryLoading] = useState(true);

  const [name, setName] = useState(
    () => localStorage.getItem("bb_cert_name") || profile?.name || user?.displayName || ""
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>("card");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /* ----- load course progress + the certificate registry record ----- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [prog, lessons] = await Promise.all([fetchProgress(), fetchLessons()]);
        if (!mounted) return;
        setCompleted(prog);
        setTotal(lessons.length);
      } catch {
        /* progress requires the account session — RequireAuth guarantees it */
      }
      if (uid) {
        const rec = await getCertificate(uid);
        if (mounted) setRecord(rec);
      }
      if (mounted) setRegistryLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  useEffect(() => {
    setName((cur) => (cur.trim() ? cur : profile?.name || user?.displayName || ""));
    setCardName((cur) => cur.trim() ? cur : profile?.name || user?.displayName || "");
  }, [profile, user]);

  const pct = total ? Math.round((completed.length / total) * 100) : 0;
  const eligible = completed.length >= total && total > 0;
  const paid = record?.status === "paid" || record?.status === "claimed";
  const pending = record?.status === "pending_payment";

  const handleName = (v: string) => {
    setName(v);
    localStorage.setItem("bb_cert_name", v);
  };

  /* -------------------- $5 payment: instant card checkout -------------------- */
  const payByCard = async () => {
    setError("");
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) return setError("Enter a valid card number (12–19 digits).");
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(cardExpiry.trim())) return setError("Enter the expiry as MM/YY.");
    if (!/^\d{3,4}$/.test(cardCvc.trim())) return setError("Enter the 3–4 digit security code (CVC).");
    setBusy(true);
    try {
      const order = await createCertificateOrder({
        uid,
        email,
        name: cardName.trim() || name.trim() || email.split("@")[0],
        completed: completed.length,
        total,
        pct,
        method: "demo-card",
      });
      const paidRecord = await payCertificate(uid, { cardLast4: digits.slice(-4), method: "demo-card" });
      setRecord(paidRecord || order);
      setCheckoutOpen(false);
      setNotice("Payment received — your certificate is unlocked. Download it below.");
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Payment failed. Confirm Firestore is reachable and you are signed in with Firebase."
      );
    } finally {
      setBusy(false);
    }
  };

  /* -------------------- $5 payment: manual (admin approves) -------------------- */
  const requestManualPayment = async () => {
    setError("");
    setBusy(true);
    try {
      const rec = await createCertificateOrder({
        uid,
        email,
        name: name.trim() || email.split("@")[0],
        completed: completed.length,
        total,
        pct,
        method: "manual",
        note: "Manual payment requested — awaiting management approval.",
      });
      setRecord(rec);
      setCheckoutOpen(false);
      setNotice(`Manual payment registered. Quote reference ${rec.serial} when paying — management will approve it.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not register the manual payment.");
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    if (!eligible || !paid || !name.trim()) return;
    setGenerating(true);
    setError("");
    try {
      await generateCertificate(name, completed.length, total, pct, {
        serial: record?.serial,
        paidAt: record?.paid_at,
        method: record?.method,
      });
      const claimed = await markCertificateClaimed(uid, name.trim());
      if (claimed) setRecord(claimed);
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
        eyebrow="Seedwel Certificate Incorporation"
        title="Your Certificate of"
        highlight="Completion"
        description="The Billionaire Blueprint is tuition-free — every lesson, quiz and masterclass costs nothing. Only the official certificate carries a one-time $5 issuance & registry fee, recorded forever in our Firebase certificate registry."
      />

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          {/* Free tuition / fee cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {(
              [
                [Landmark, "Tuition", "$0 — Free", "text-emerald-300"],
                [BadgeCheck, "Curriculum", `${total} lessons`, "text-amber-300"],
                [Receipt, "Certificate", `$${CERT_PRICE_USD} one-time`, "text-sky-300"],
              ] as [React.ElementType, string, string, string][]
            ).map(([Icon, label, value, tone], i) => (
              <div key={i} className="rounded-2xl bg-gray-900/60 border border-gray-800 p-4 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${tone}`} />
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</div>
                <div className={`text-sm font-black mt-0.5 ${tone}`}>{value}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-gray-600 mb-8 -mt-4">
            Seedwel Investment Limited has not built a school — this is a certification program.
            Certificates are issued and recorded by the Seedwel Certificate Incorporation registry.
          </p>

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
                Finish all {total} lessons ({total - completed.length} remaining) to become eligible.
                Tuition is free — you'll only ever pay the $5 certificate issuance fee when you claim it.
              </p>
              <Link
                to="/lessons"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                Continue Learning — Free
              </Link>
            </div>
          )}

          {eligible && (
            <>
              {/* Certificate preview */}
              <div className="relative bg-[#111827] border-4 border-[#d1ab52] rounded-lg p-6 md:p-10 mb-8 shadow-2xl shadow-amber-500/10">
                <div className="absolute inset-2 border border-[#d1ab52]/60 rounded" />
                {paid && (
                  <div className="absolute top-5 right-5 rotate-12 rounded-lg border-2 border-emerald-400/70 px-3 py-1 text-emerald-300 text-[10px] font-black tracking-widest uppercase">
                    Fee Paid · ${CERT_PRICE_USD}
                  </div>
                )}
                <div className="relative text-center">
                  <div className="flex justify-center mb-3">
                    <img
                      src="/images/seedwel-logo.svg"
                      alt="Seedwel Investment Limited"
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                  <div className="text-[#d1ab52] font-bold tracking-[0.3em] text-[10px] md:text-xs mb-1">
                    SEEDWEL CERTIFICATE INCORPORATION
                  </div>
                  <div className="text-[#d1ab52] font-bold tracking-[0.25em] text-[10px] md:text-xs mb-2">
                    BILLIONAIRE BLUEPRINT
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
                    across all six modules of the Billionaire Blueprint wealth certification program.
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
                      <div className="w-40 border-t border-[#d1ab52] pt-2">Certificate Incorporation Registry</div>
                    </div>
                  </div>
                  {record?.serial && (
                    <p className="text-[11px] font-mono text-[#d1ab52]/90 mt-5">Certificate No. {record.serial}</p>
                  )}
                </div>
              </div>

              {notice && (
                <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {notice}
                </div>
              )}

              {/* ============ STATE: claim / pay $5 ============ */}
              {!paid && !pending && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-emerald-300" />
                    </span>
                    <div>
                      <h3 className="font-black text-white">You've earned it — claim your certificate</h3>
                      <p className="text-xs text-gray-500">Tuition was free. This is the only fee in the entire program.</p>
                    </div>
                  </div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Name on certificate
                  </label>
                  <input
                    value={name}
                    onChange={(e) => handleName(e.target.value)}
                    placeholder="Enter the name to appear on your certificate"
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors mb-5"
                  />
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Certificate issuance & registry fee</div>
                      <div className="text-3xl font-black text-white mt-1">${CERT_PRICE_USD}<span className="text-sm text-gray-500 font-semibold">.00 USD · one-time</span></div>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-sm">
                        Recorded permanently in the Seedwel Certificate Incorporation registry (Firebase) with a unique serial number.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!name.trim()) return setError("Enter the name for your certificate first.");
                        setError("");
                        setCheckoutOpen(true);
                      }}
                      disabled={registryLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-black px-6 py-3.5 text-sm hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50"
                    >
                      {registryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Pay ${CERT_PRICE_USD} & Claim
                    </button>
                  </div>
                  {error && <p className="text-rose-400 text-sm">{error}</p>}
                </div>
              )}

              {/* ============ STATE: pending manual approval ============ */}
              {!paid && pending && record && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-amber-300" />
                    </span>
                    <div>
                      <h3 className="font-black text-white">Manual payment pending approval</h3>
                      <p className="text-xs text-gray-500">
                        Reference <code className="text-amber-400 font-mono">{record.serial}</code> · ${CERT_PRICE_USD} one-time
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-5">
                    Your claim is registered in the certificate registry. Complete your $5 payment with management
                    (quote the serial above) — an admin approves it from the <b>Admin → Certificates</b> tab and your
                    download unlocks instantly. Prefer not to wait?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        setError("");
                        setCheckoutMode("card");
                        setCheckoutOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-black px-5 py-3 text-xs hover:from-emerald-400 hover:to-teal-400 transition-all"
                    >
                      <CreditCard className="w-4 h-4" /> Pay ${CERT_PRICE_USD} instantly by card
                    </button>
                    <Link
                      to="/founders"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/60 px-5 py-3 text-xs font-bold text-gray-300 hover:text-white"
                    >
                      Contact Management
                    </Link>
                  </div>
                  {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
                </div>
              )}

              {/* ============ STATE: paid → download ============ */}
              {paid && (
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
                  <div className="flex items-center gap-2 mb-4 text-emerald-300 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Fee paid{record?.cardLast4 ? ` · card •••• ${record.cardLast4}` : ""} — registered as{" "}
                    <code className="font-mono text-amber-400">{record?.serial}</code>
                  </div>
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
                    {generating ? "Generating PDF..." : record?.status === "claimed" ? "Download Again (PDF)" : "Download Certificate (PDF)"}
                  </button>
                  {record?.status === "claimed" && (
                    <p className="text-center text-[11px] text-gray-500 mt-3 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Claimed {record.claimed_at ? new Date(record.claimed_at).toLocaleString() : ""} — your serial stays in the registry forever.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ==================== CHECKOUT MODAL ($5) ==================== */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[70] bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && setCheckoutOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div>
                <h3 className="font-black text-white">Certificate Checkout</h3>
                <p className="text-[11px] text-gray-500">One-time issuance fee · tuition stays free forever</p>
              </div>
              <button onClick={() => !busy && setCheckoutOpen(false)} className="rounded-lg bg-gray-800 hover:bg-gray-700 p-2 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 mb-5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Billionaire Blueprint Certificate</span>
                <span className="text-lg font-black text-emerald-300">${CERT_PRICE_USD}.00</span>
              </div>

              {/* method tabs */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => setCheckoutMode("card")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border transition-all ${
                    checkoutMode === "card"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-gray-800/60 border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Card · Instant
                </button>
                <button
                  onClick={() => setCheckoutMode("manual")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold border transition-all ${
                    checkoutMode === "manual"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                      : "bg-gray-800/60 border-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Manual · Admin approves
                </button>
              </div>

              {checkoutMode === "card" ? (
                <div className="space-y-3">
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Cardholder name"
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                  />
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s-]/g, "").slice(0, 23))}
                    placeholder="Card number (e.g. 4242 4242 4242 4242)"
                    inputMode="numeric"
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.slice(0, 7))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                    <input
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="CVC"
                      inputMode="numeric"
                      className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    Built-in checkout records the payment straight into the Firebase certificate registry.
                    Hook Stripe/PayPal keys to this same flow for live card processing.
                  </p>
                  {error && <p className="text-rose-400 text-xs">{error}</p>}
                  <button
                    onClick={payByCard}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-black px-6 py-3.5 text-sm hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {busy ? "Processing…" : `Pay $${CERT_PRICE_USD}.00 Now`}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Register your claim now and pay management directly (bank transfer / mobile money / cash).
                    You'll get a unique <b>serial as your payment reference</b>. As soon as an admin approves it
                    in <b>Admin → Certificates</b>, your certificate download unlocks.
                  </p>
                  {error && <p className="text-rose-400 text-xs">{error}</p>}
                  <button
                    onClick={requestManualPayment}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black px-6 py-3.5 text-sm hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                    {busy ? "Registering…" : "Register Manual Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
