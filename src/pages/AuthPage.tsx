import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Key,
  User as UserIcon,
  LogIn,
  UserPlus,
  Loader2,
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth, authErrorMessage } from "../lib/auth";
import { cn } from "../utils/cn";

const perks = [
  { icon: BookOpen, text: "Unlock all 28 curriculum lessons & quizzes" },
  { icon: TrendingUp, text: "Track your progress on your personal account" },
  { icon: Award, text: "Earn the official completion certificate (PDF)" },
  { icon: ShieldCheck, text: "Join discussions & the student leaderboard" },
];

export default function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword, sessionKind } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/lessons";

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && (user || sessionKind === "dev")) {
      navigate(next, { replace: true });
    }
  }, [user, loading, sessionKind, navigate, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError("");
    if (!email.trim()) {
      setError("Enter your email above first, then click reset.");
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-stretch">
          {/* Left: why register */}
          <div className="hidden md:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-amber-500/15 via-gray-900 to-gray-950 border border-amber-500/25 p-8">
            <div>
              {/* Company logo — transparent, no background box */}
              <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-20 h-20 object-contain" />
              <h1 className="text-3xl font-black mt-5 leading-tight">
                Create your free <span className="text-amber-400">Seedwel</span> student account
              </h1>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                The Billionaire Blueprint course is reserved for registered students of Seedwel
                Investment Limited. Registration takes less than a minute.
              </p>
              <ul className="mt-6 space-y-3.5">
                {perks.map((p, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <p.icon className="w-4 h-4 text-amber-400" />
                    </span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-gray-600 mt-8">
              Secured by Firebase Authentication • Your progress is stored on your account
            </p>
          </div>

          {/* Right: form card */}
          <div className="rounded-3xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <div className="md:hidden flex items-center gap-3 mb-6">
              <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-lg font-black text-white">Seedwel Student Account</h1>
                <p className="text-xs text-amber-400 font-semibold">Seedwel Investment Limited</p>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-950/80 border border-gray-800 p-1.5 mb-6">
              {(
                [
                  { id: "signin", label: "Sign In", icon: LogIn },
                  { id: "register", label: "Create Account", icon: UserPlus },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMode(t.id);
                    setError("");
                    setResetSent(false);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all",
                    mode === t.id
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chanda Mwansa"
                      className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {resetSent && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Password reset email sent — check your inbox.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === "register" ? (
                  <UserPlus className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {busy ? "Please wait…" : mode === "register" ? "Create My Free Account" : "Sign In to My Account"}
              </button>
            </form>

            {mode === "signin" && (
              <div className="mt-4 text-center">
                <button onClick={handleReset} className="text-xs text-gray-500 hover:text-amber-400 transition-colors">
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-gray-800/80 pt-4 flex items-center justify-between text-xs text-gray-500">
              <Link to="/" className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
              <span>Firebase Authentication</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
