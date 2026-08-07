import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Crown,
  Loader2,
  LogOut,
  Mail,
  PlayCircle,
  ShieldCheck,
  Trophy,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { useAuth, ADMIN_EMAILS } from "../lib/auth";
import {
  CERT_PRICE_USD,
  getCertificate,
  listAssignedAdmins,
  type AdminAssignment,
  type CertificateRecord,
} from "../lib/firestore";
import { fetchLeaderboard, fetchLessons, fetchProgress, type LeaderboardEntry, type Lesson } from "../lib/api";

export default function AccountPage() {
  const { user, profile, isAdmin, fsRole, sessionKind, logout } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [admins, setAdmins] = useState<AdminAssignment[]>([]);
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName =
    profile?.name || user?.displayName || (profile?.email || user?.email || "Student").split("@")[0];
  const email = profile?.email || user?.email || "";
  const uid = profile?.uid || user?.uid || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ls, b, adminList] = await Promise.all([fetchLessons(), fetchLeaderboard(), listAssignedAdmins()]);
      setLessons(ls);
      setBoard(b);
      setAdmins(adminList);
      try {
        const ids = await fetchProgress();
        setCompleted(new Set(ids));
      } catch {
        setCompleted(new Set());
      }
      if (uid) setCert(await getCertificate(uid));
      setLoading(false);
    })();
  }, [uid]);

  /** Everyone visible as admin: Firebase assignments + the founder allowlist. */
  const adminDirectory = useMemo(() => {
    const map = new Map<string, { email: string; name: string; source: string }>();
    for (const adm of admins) {
      if (adm.email) {
        map.set(adm.email, {
          email: adm.email,
          name: adm.name || adm.email.split("@")[0],
          source: "Assigned in Firebase",
        });
      }
    }
    for (const e of ADMIN_EMAILS) {
      if (!map.has(e)) map.set(e, { email: e, name: e.split("@")[0], source: "Founder allowlist" });
    }
    return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [admins]);

  const pct = useMemo(
    () => (lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0),
    [completed, lessons]
  );
  const nextLesson = useMemo(() => lessons.find((l) => !completed.has(l.id)), [lessons, completed]);
  const myRank = useMemo(() => board.find((e) => email && e.name === profile?.name), [board, email, profile]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="My Account"
        title={`Welcome back,`}
        highlight={displayName.split(" ")[0]}
        description="Your Seedwel student dashboard — progress, achievements and account."
      />

      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        {/* ==================== ADMIN TAB (detected from the Firebase role) ==================== */}
        {isAdmin && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-gray-900/80 to-gray-900/60 border border-amber-500/40 p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-amber-300" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-black text-white">Admin Access Detected</h2>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                    role: admin {fsRole === "admin" ? "· stored in Firebase" : sessionKind === "dev" ? "· dev session" : "· founder allowlist"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Your account is assigned the admin role. Manage the course database, registered users,
                  certificate registry and payments from the management console.
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black px-5 py-3 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
            >
              <UserCog className="w-4 h-4" /> Open Admin Portal
            </Link>
          </div>
        )}

        {/* Account + progress summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
            <div className="flex items-center gap-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold text-white truncate">{displayName}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3" /> {email}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isAdmin
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {isAdmin ? "Management" : "Registered Student"}
                  </span>
                  {sessionKind === "dev" && (
                    <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                      dev preview
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 text-xs font-bold text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Progress ring */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Completion</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="py-4">
              <div className="text-4xl font-black text-white">
                {loading ? "…" : `${pct}%`}
              </div>
              <div className="mt-3 h-3 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {completed.size} of {lessons.length} lessons complete
              </p>
            </div>
            {nextLesson ? (
              <Link
                to={`/lessons/${nextLesson.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-4 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                <PlayCircle className="w-4 h-4" /> Continue: {nextLesson.title}
              </Link>
            ) : (
              <Link
                to="/certificate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-bold px-4 py-2.5 text-xs"
              >
                <Award className="w-4 h-4" /> Claim Your Certificate
              </Link>
            )}
          </div>

          {/* Leaderboard position */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Leaderboard</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            {myRank && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-3 text-xs">
                <span className="text-amber-300 font-bold">Your rank: #{myRank.rank}</span>
                <span className="text-gray-400"> — {myRank.completed} lessons done</span>
              </div>
            )}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {board.slice(0, 8).map((e) => (
                <div key={e.rank} className="flex items-center justify-between text-xs rounded-lg bg-gray-950/70 border border-gray-800/80 px-3 py-2">
                  <span className="text-gray-300 truncate">
                    <span className="text-amber-400 font-bold mr-2">#{e.rank}</span>
                    {e.name || e.clientId}
                  </span>
                  <span className="text-gray-500 font-mono ml-2">{e.completed}</span>
                </div>
              ))}
              {board.length === 0 && !loading && (
                <p className="text-xs text-gray-500">No completions yet — finish a lesson to appear here.</p>
              )}
            </div>
          </div>
        </div>

        {/* Certificate registry + assigned administrators */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Certificate status (Seedwel Certificate Incorporation) */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Certificate · ${CERT_PRICE_USD} claim</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Reading the registry…
              </div>
            ) : cert ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${
                      cert.status === "claimed"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : cert.status === "paid"
                          ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {cert.status === "claimed"
                      ? "Claimed & Issued"
                      : cert.status === "paid"
                        ? "Fee Paid — Ready to Download"
                        : "Pending Payment Approval"}
                  </span>
                  <code className="text-[11px] font-mono text-gray-400">{cert.serial}</code>
                </div>
                <p className="text-xs text-gray-500">
                  {cert.status === "pending_payment"
                    ? `Your $${CERT_PRICE_USD} manual payment is awaiting management approval.`
                    : `Registered in the Seedwel Certificate Incorporation registry for ${cert.name || displayName}.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No certificate claim yet. Tuition is free — when you complete all lessons you can claim the official
                certificate for a one-time ${CERT_PRICE_USD} issuance fee.
              </p>
            )}
            <Link
              to="/certificate"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 text-xs font-bold text-amber-300 w-full transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              {cert?.status === "paid" || cert?.status === "claimed" ? "Open My Certificate" : `View Certificate ($${CERT_PRICE_USD})`}
            </Link>
          </div>

          {/* Who is assigned admin — detected from Firebase */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Administrators</span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-gray-600 mb-3">
              Live from the Firebase <code className="text-amber-500/80 font-mono">admins</code> registry — these accounts
              hold the admin role and can manage the platform.
            </p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {adminDirectory.map((a) => (
                <div key={a.email} className="flex items-center gap-3 rounded-lg bg-gray-950/70 border border-gray-800/80 px-3 py-2">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-[11px] font-black text-gray-950 shrink-0">
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-200 truncate">{a.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{a.email}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-black text-amber-300 uppercase">
                    admin
                  </span>
                </div>
              ))}
              {adminDirectory.length === 0 && !loading && (
                <p className="text-xs text-gray-500">No admins published yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Lesson completion list */}
        <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" /> Your Curriculum Progress
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading progress…
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2.5">
              {lessons.map((l) => {
                const done = completed.has(l.id);
                return (
                  <Link
                    key={l.id}
                    to={`/lessons/${l.id}`}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
                      done
                        ? "bg-emerald-500/5 border-emerald-500/25 hover:border-emerald-500/50"
                        : "bg-gray-950/60 border-gray-800 hover:border-amber-500/40"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${done ? "text-emerald-300" : "text-gray-200"}`}>
                        {l.number}. {l.title}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">{l.duration} • {l.difficulty}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/lessons" className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 hover:border-amber-500/40 transition-all group">
            <BookOpen className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-bold text-sm group-hover:text-amber-300">Curriculum</div>
            <div className="text-xs text-gray-500 mt-1">Browse all modules & lessons</div>
          </Link>
          <Link to="/certificate" className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 hover:border-amber-500/40 transition-all group">
            <Award className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-bold text-sm group-hover:text-amber-300">Certificate</div>
            <div className="text-xs text-gray-500 mt-1">Generate your completion PDF</div>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 hover:border-amber-500/60 transition-all group">
              <UserIcon className="w-5 h-5 text-amber-400 mb-2" />
              <div className="font-bold text-sm text-amber-300">Admin Portal</div>
              <div className="text-xs text-amber-400/60 mt-1">Manage users, content & database</div>
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
