import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
  LogOut,
  Mail,
  PlayCircle,
  ShieldCheck,
  Trophy,
  User as UserIcon,
  DollarSign,
  Building2,
  BadgeCheck,
  CreditCard,
  Users,
  Database,
  Crown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";
import { fetchLeaderboard, fetchLessons, fetchProgress, type LeaderboardEntry, type Lesson } from "../lib/api";
import {
  subscribeToAdmins,
  listAllUsersFirestore,
  getCertificateStatus,
  getProgressFirestore,
  type FirestoreUser,
  type CertificateClaim,
} from "../lib/firestoreDb";
import { CERTIFICATE_FEE } from "../lib/certificateService";

export default function AccountPage() {
  const { user, profile, firestoreUser, isAdmin, sessionKind, logout } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Firebase true DB states
  const [admins, setAdmins] = useState<FirestoreUser[]>([]);
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [cert, setCert] = useState<CertificateClaim | null>(null);

  const displayName =
    profile?.name || firestoreUser?.name || user?.displayName || (profile?.email || user?.email || "Student").split("@")[0];
  const email = profile?.email || firestoreUser?.email || user?.email || "";
  const uid = profile?.uid || firestoreUser?.uid || user?.uid || "";

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ls, b] = await Promise.all([fetchLessons(), fetchLeaderboard()]);
      setLessons(ls);
      setBoard(b);

      // progress from Firestore true DB first, fallback to API
      try {
        const firestoreProgress = uid ? await getProgressFirestore(uid) : [];
        if (firestoreProgress.length) {
          setCompleted(new Set(firestoreProgress));
        } else {
          const ids = await fetchProgress();
          setCompleted(new Set(ids));
        }
      } catch {
        try {
          const ids = await fetchProgress();
          setCompleted(new Set(ids));
        } catch {
          setCompleted(new Set());
        }
      }

      // cert status
      try {
        if (uid) {
          const c = await getCertificateStatus(uid);
          if (c) setCert(c);
        }
      } catch {}

      // users + admins from Firestore
      try {
        const users = await listAllUsersFirestore();
        if (users.length) setAllUsers(users);
      } catch {}

      setLoading(false);
    })();
  }, [uid]);

  // subscribe to real-time admin list (true DB)
  useEffect(() => {
    const unsub = subscribeToAdmins((adminList) => setAdmins(adminList));
    return () => unsub();
  }, []);

  const pct = useMemo(() => (lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0), [completed, lessons]);
  const nextLesson = useMemo(() => lessons.find((l) => !completed.has(l.id)), [lessons, completed]);
  const myRank = useMemo(() => board.find((e) => email && e.name === profile?.name), [board, email, profile]);
  const isPaidCert = !!cert?.paid;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="My Account • Firebase True Database"
        title={`Welcome back,`}
        highlight={displayName.split(" ")[0]}
        description="Your Seedwel student dashboard — tuition FREE, certificate $5 paid, powered by Firebase Firestore as true database. Admin role detected from users/{uid} doc."
      />

      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        {/* Incorporation + fee transparency */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-gray-900/60 p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex gap-4">
            <Building2 className="w-10 h-10 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-amber-400" /> Certificate Incorporation • 2025 • No physical school built yet
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                Tuition is <span className="text-emerald-300 font-bold">$0 FREE</span> worldwide. Certificate claim is{" "}
                <span className="text-amber-300 font-bold">${CERTIFICATE_FEE} USD</span> paid — covers Firestore verification, anti-forgery registry,
                incorporation admin. True database: <code className="text-amber-400">Firebase Firestore • project: seedwel-cbeb8</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold text-emerald-300">
              Tuition FREE
            </span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cert ${CERTIFICATE_FEE} Paid
            </span>
          </div>
        </div>

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
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isAdmin
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                        : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {isAdmin ? "Management • Admin (Firestore role)" : "Registered Student • FREE tuition"}
                  </span>
                  {sessionKind === "dev" && (
                    <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-300">dev preview</span>
                  )}
                  {firestoreUser?.role && (
                    <span className="rounded-full bg-gray-800 border border-gray-700 px-2 py-0.5 text-[10px] font-mono text-gray-400">
                      Firestore role: {firestoreUser.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate paid status */}
            {cert && (
              <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" /> Certificate
                  </span>
                  <span className={`font-bold ${isPaidCert ? "text-emerald-300" : "text-amber-300"}`}>
                    {isPaidCert ? "Paid ✓" : `$${CERTIFICATE_FEE} to claim`}
                  </span>
                </div>
                {cert.certificateNumber && (
                  <div className="text-[11px] text-gray-500 font-mono mt-1 truncate">{cert.certificateNumber}</div>
                )}
                <div className="text-[10px] text-gray-600 mt-1">
                  {cert.completedLessons}/{cert.totalLessons} • {cert.percentage}% • {cert.paymentStatus}
                </div>
              </div>
            )}

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
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Completion — FREE</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="py-4">
              <div className="text-4xl font-black text-white">{loading ? "…" : `${pct}%`}</div>
              <div className="mt-3 h-3 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {completed.size} of {lessons.length} lessons complete • stored in Firestore <code className="text-amber-500/60">user_progress/{uid.slice(0, 6)}…</code>
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
                className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold px-4 py-2.5 text-xs ${
                  isPaidCert ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950"
                }`}
              >
                <Award className="w-4 h-4" /> {isPaidCert ? "Download Paid Certificate" : `Claim Certificate $${CERTIFICATE_FEE}`}
              </Link>
            )}
          </div>

          {/* Leaderboard + Admin detection */}
          <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Leaderboard + Admins</span>
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>

            {isAdmin && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 mb-3 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Admin detected — Firebase role = admin
                </div>
                <div className="text-amber-200/60 mt-1">
                  Admin tab unlocked in Dashboard. You can manage users, content, certificates & true database console.
                </div>
              </div>
            )}

            {/* Admins list from Firestore */}
            <div className="mb-4">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-400" /> Management (Firestore role=admin) — {admins.length}
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {admins.slice(0, 5).map((a) => (
                  <div key={a.uid} className="flex items-center justify-between text-xs rounded-lg bg-gray-950/70 border border-amber-500/20 px-3 py-1.5">
                    <span className="text-amber-200 truncate">{a.name || a.email}</span>
                    <span className="text-[10px] text-amber-400/60 font-mono ml-2">admin</span>
                  </div>
                ))}
                {admins.length === 0 && <p className="text-[11px] text-gray-600">No admins in Firestore yet — promote via Admin portal.</p>}
              </div>
            </div>

            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Top Students</div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {board.slice(0, 6).map((e) => (
                <div key={e.rank} className="flex items-center justify-between text-xs rounded-lg bg-gray-950/70 border border-gray-800/80 px-3 py-2">
                  <span className="text-gray-300 truncate">
                    <span className="text-amber-400 font-bold mr-2">#{e.rank}</span>
                    {e.name || e.clientId}
                  </span>
                  <span className="text-gray-500 font-mono ml-2">{e.completed}</span>
                </div>
              ))}
              {board.length === 0 && !loading && <p className="text-xs text-gray-500">No completions yet.</p>}
            </div>
          </div>
        </div>

        {/* Admin tab in student dashboard — who is assigned admin */}
        {isAdmin && (
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/70 to-gray-900/60 border border-amber-500/30 p-6">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" /> Admin Tab — Management Detection (Firebase Role)
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              You are signed as role <code className="text-amber-400">admin</code> in Firebase Firestore <code className="text-amber-400/70">users/{uid}</code>. This tab shows all users assigned admin, plus true database metrics. Student dashboard detects admin via Firestore.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-950/70 border border-gray-800 p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Total Registered
                </div>
                <div className="text-2xl font-black text-white mt-1">{allUsers.length || "—"}</div>
                <div className="text-[11px] text-gray-600">from Firestore users collection</div>
              </div>
              <div className="rounded-2xl bg-gray-950/70 border border-amber-500/30 p-4">
                <div className="text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Admins
                </div>
                <div className="text-2xl font-black text-amber-300 mt-1">{admins.length}</div>
                <div className="text-[11px] text-amber-200/60">role=admin in Firestore</div>
              </div>
              <div className="rounded-2xl bg-gray-950/70 border border-gray-800 p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> True DB Engine
                </div>
                <div className="text-sm font-bold text-white mt-1">Firestore</div>
                <div className="text-[11px] text-gray-600">seedwel-cbeb8 • collection-based</div>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-5 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                <UserIcon className="w-4 h-4" /> Open Full Admin Portal • Database Console • Certificate Claims
              </Link>
            </div>

            {/* list of admins with emails */}
            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {admins.map((a) => (
                <div key={a.uid} className="rounded-xl bg-gray-950/80 border border-amber-500/20 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-xs">
                    {(a.name || a.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{a.name || "Admin"}</div>
                    <div className="text-[11px] text-gray-500 truncate">{a.email}</div>
                    <div className="text-[10px] text-amber-400/70 font-mono">role: {a.role} • {a.uid.slice(0, 12)}…</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lesson completion list */}
        <div className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" /> Your Curriculum Progress — Tuition FREE
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading from Firestore…
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
                    {done ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <Circle className="w-5 h-5 text-gray-600 shrink-0" />}
                    <div className="min-w-0">
                      <div className={`font-semibold truncate ${done ? "text-emerald-300" : "text-gray-200"}`}>
                        {l.number}. {l.title}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {l.duration} • {l.difficulty} • {done ? "Completed in Firestore" : "Free tuition"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Link to="/lessons" className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 hover:border-amber-500/40 transition-all group">
            <BookOpen className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-bold text-sm group-hover:text-amber-300">Curriculum (FREE)</div>
            <div className="text-xs text-gray-500 mt-1">Browse all modules & lessons — tuition $0</div>
          </Link>
          <Link to="/certificate" className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 hover:border-amber-500/40 transition-all group">
            <Award className="w-5 h-5 text-amber-400 mb-2" />
            <div className="font-bold text-sm group-hover:text-amber-300">Certificate — ${CERTIFICATE_FEE} Paid</div>
            <div className="text-xs text-gray-500 mt-1">
              {isPaidCert ? "Paid ✓ Download PDF" : `Pay $${CERTIFICATE_FEE} to claim verified PDF`}
            </div>
          </Link>
          <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5">
            <CreditCard className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="font-bold text-sm text-white">Tuition Model</div>
            <div className="text-xs text-gray-500 mt-1">FREE tuition • ${CERTIFICATE_FEE} cert fee • No school built yet — incorporation entity</div>
          </div>
          {isAdmin && (
            <Link to="/admin" className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-5 hover:border-amber-500/60 transition-all group">
              <UserIcon className="w-5 h-5 text-amber-400 mb-2" />
              <div className="font-bold text-sm text-amber-300">Admin Portal (True DB)</div>
              <div className="text-xs text-amber-400/60 mt-1">Manage users, roles (Firestore), certificates, content & Firestore console</div>
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
