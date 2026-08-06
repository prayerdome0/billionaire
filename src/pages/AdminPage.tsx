import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Lock,
  Mail,
  Key,
  LogOut,
  RefreshCw,
  Building2,
  Cpu,
  TrendingUp,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  MessageSquare,
  Award,
  PlusCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  FileEdit,
  Trash2,
  UserCog,
  Inbox,
  Table2,
  X,
  Save,
  RotateCcw,
  GraduationCap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth, authErrorMessage, ADMIN_EMAILS } from "../lib/auth";
import {
  fetchAdminOverview,
  fetchAdminRecommendations,
  fetchAdminUsers,
  setAdminUserRole,
  deleteAdminUser,
  fetchAdminDatabase,
  fetchAdminTable,
  deleteAdminRecord,
  reseedContent,
  fetchAdminContent,
  createAdminContent,
  updateAdminContent,
  deleteAdminContent,
  type AdminOverview,
  type UpgradeRecommendation,
  type RegisteredUser,
  type AdminDatabaseInfo,
  type ContentResource,
} from "../lib/api";
import { cn } from "../utils/cn";

type Tab = "overview" | "users" | "content" | "inbox" | "database" | "advisor";

const RESOURCE_META: Record<ContentResource, { label: string; idField: string; titleOf: (r: any) => string; template: Record<string, unknown> }> = {
  lessons: {
    label: "Lessons",
    idField: "id",
    titleOf: (r) => r.title || r.id,
    template: { id: "l29-new-lesson", moduleId: "m6", number: 29, title: "New Lesson", subtitle: "", summary: "", duration: "20 min", difficulty: "Beginner", content: [{ heading: "Introduction", paragraphs: ["Write the lesson here."] }], takeaways: ["Key point"], actionSteps: ["Do this"], quiz: [] },
  },
  videos: {
    label: "Videos",
    idField: "id",
    titleOf: (r) => r.title || r.id,
    template: { id: "vid-new", title: "New Masterclass", channel: "Seedwel", description: "", youtubeId: "", moduleId: "m1", duration: "15:00", level: "Beginner", tags: [] },
  },
  niches: {
    label: "Niches",
    idField: "id",
    titleOf: (r) => r.title || r.id,
    template: { id: "niche-new", title: "New Niche", icon: "briefcase", image: "/images/seedwel-logo.png", description: "", potentialEarnings: "", examples: [], strategies: [], whyHighPaying: "", gettingStarted: [] },
  },
  founders: {
    label: "Founders",
    idField: "id",
    titleOf: (r) => r.name || r.id,
    template: { id: "founder-new", name: "New Leader", role: "", photo: "/images/seedwel-logo.png", bio: "", quote: "", focus: [], funFact: "", email: "", socials: { linkedin: "", twitter: "" } },
  },
  posts: {
    label: "Blog Posts",
    idField: "slug",
    titleOf: (r) => r.title || r.slug,
    template: { slug: "new-post", title: "New Article", excerpt: "", authorId: "seedwell-masuku", date: new Date().toISOString().slice(0, 10), readTime: "4 min read", tags: [], content: [{ heading: "Intro", paragraphs: ["Write here."] }] },
  },
  modules: {
    label: "Modules",
    idField: "id",
    titleOf: (r) => r.title || r.id,
    template: { id: "m7", number: 7, title: "New Module", tagline: "", description: "", icon: "book", gradient: "from-amber-500 to-yellow-500" },
  },
};

const FALLBACK_TABLE_KEY: Record<string, string> = {
  founders: "id", modules: "id", lessons: "id", videos: "id", niches: "id", posts: "slug",
  testimonials: "id", contact_messages: "id", comments: "id", subscribers: "id",
  investor_inquiries: "id", lesson_progress: "id", users: "uid",
};

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin, profile, sessionKind, signIn, devAdminSignIn, logout } = useAuth();
  const signedIn = !!user || sessionKind === "dev";

  const [email, setEmail] = useState("seedwell@seedwel.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [notAdmin, setNotAdmin] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [recommendations, setRecommendations] = useState<UpgradeRecommendation[]>([]);
  const [recFilter, setRecFilter] = useState("All");
  const [recStatusMap, setRecStatusMap] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [dbInfo, setDbInfo] = useState<AdminDatabaseInfo | null>(null);
  const [openTable, setOpenTable] = useState<string | null>(null);
  const [tableRows, setTableRows] = useState<Record<string, unknown>[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const [resource, setResource] = useState<ContentResource>("lessons");
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [editor, setEditor] = useState<{ mode: "edit" | "new"; id?: string; text: string } | null>(null);
  const [editorError, setEditorError] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);
  const [reseedBusy, setReseedBusy] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3000);
  };

  /* ---------------- data loaders ---------------- */
  const loadOverview = useCallback(async () => {
    setLoadingData(true);
    setDataError("");
    try {
      const [ov, recs] = await Promise.all([fetchAdminOverview(), fetchAdminRecommendations()]);
      setOverview(ov);
      if (ov.users) setUsers(ov.users);
      if (recs?.recommendations) setRecommendations(recs.recommendations);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await fetchAdminUsers());
    } catch {
      /* shown via overview error */
    }
  }, []);

  const loadDb = useCallback(async () => {
    try {
      setDbInfo(await fetchAdminDatabase());
    } catch {
      /* ignore */
    }
  }, []);

  const loadTable = useCallback(async (table: string) => {
    setTableLoading(true);
    setOpenTable(table);
    try {
      setTableRows(await fetchAdminTable(table));
    } catch {
      setTableRows([]);
    } finally {
      setTableLoading(false);
    }
  }, []);

  const loadResource = useCallback(async (r: ContentResource) => {
    setRecordsLoading(true);
    try {
      setRecords((await fetchAdminContent(r)) as Record<string, unknown>[]);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadOverview();
      loadDb();
    }
  }, [isAdmin, loadOverview, loadDb]);

  useEffect(() => {
    if (isAdmin && activeTab === "content") loadResource(resource);
  }, [isAdmin, activeTab, resource, loadResource]);

  useEffect(() => {
    if (isAdmin && (activeTab === "users" || activeTab === "database")) {
      loadUsers();
      loadDb();
    }
  }, [isAdmin, activeTab, loadUsers, loadDb]);

  /* ---------------- actions ---------------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setNotAdmin(false);
    setLoginLoading(true);
    try {
      await signIn(email, password);
      // profile/isAdmin get set by AuthProvider after /api/auth/me sync.
    } catch (err) {
      setLoginError(authErrorMessage(err));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoginError("");
    setNotAdmin(false);
    setLoginLoading(true);
    try {
      await devAdminSignIn("seed@admin", "122023");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Development login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    // Signed in via Firebase but the server says: not an admin.
    if (signedIn && user && !authLoading && profile && !profile.role?.includes?.("admin") && !isAdmin && sessionKind === "firebase") {
      setNotAdmin(true);
    } else {
      setNotAdmin(false);
    }
  }, [signedIn, user, authLoading, profile, isAdmin, sessionKind]);

  const handleLogout = async () => {
    await logout();
    setOverview(null);
    setUsers([]);
    setDbInfo(null);
    setOpenTable(null);
  };

  const toggleRecStatus = (id: string) => {
    setRecStatusMap((prev) => {
      const cur = prev[id] || "Recommended";
      const next = cur === "Recommended" ? "In Progress" : cur === "In Progress" ? "Completed" : "Recommended";
      return { ...prev, [id]: next };
    });
  };

  const filteredRecs = useMemo(
    () =>
      recommendations.filter((r) => {
        if (recFilter === "All") return true;
        if (recFilter === "School Building" && r.category.includes("School")) return true;
        if (recFilter === "AI & Developers" && r.category.includes("AI")) return true;
        if (recFilter === "Investor Deal Flow" && r.category.includes("Investor")) return true;
        if (recFilter === "Curriculum" && r.category.includes("Curriculum")) return true;
        if (recFilter === "Technical" && r.category.includes("Technical")) return true;
        return false;
      }),
    [recommendations, recFilter]
  );

  const handleDeleteRow = async (table: string, row: Record<string, unknown>) => {
    const keyField = FALLBACK_TABLE_KEY[table] || "id";
    const key = row[keyField] ?? row.id;
    if (key === undefined) return showToast("Cannot determine record key");
    if (!window.confirm(`Delete this ${table} record (${String(key)})?`)) return;
    try {
      await deleteAdminRecord(table, String(key));
      showToast("Record deleted");
      loadTable(table);
      loadDb();
      loadOverview();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const openRecordEditor = (mode: "edit" | "new", record?: Record<string, unknown>) => {
    const meta = RESOURCE_META[resource];
    const obj = mode === "new" ? meta.template : record;
    setEditorError("");
    setEditor({ mode, id: mode === "edit" ? String(record?.[meta.idField]) : undefined, text: JSON.stringify(obj, null, 2) });
  };

  const saveRecord = async () => {
    if (!editor) return;
    setEditorError("");
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(editor.text);
    } catch (e) {
      setEditorError(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    const meta = RESOURCE_META[resource];
    if (!obj[meta.idField]) {
      setEditorError(`The record must include "${meta.idField}".`);
      return;
    }
    setSavingRecord(true);
    try {
      if (editor.mode === "edit" && editor.id !== undefined) {
        await updateAdminContent(resource, editor.id, obj);
      } else {
        await createAdminContent(resource, obj);
      }
      showToast(`${meta.label.slice(0, -1)} saved to the database`);
      setEditor(null);
      loadResource(resource);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingRecord(false);
    }
  };

  const removeRecord = async (record: Record<string, unknown>) => {
    const meta = RESOURCE_META[resource];
    const id = String(record[meta.idField]);
    if (!window.confirm(`Delete ${meta.label.slice(0, -1)} "${meta.titleOf(record)}"? This writes to the database.`)) return;
    try {
      await deleteAdminContent(resource, id);
      showToast("Record deleted");
      loadResource(resource);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReseed = async () => {
    if (!window.confirm("Restore ALL content tables (lessons, videos, niches, founders, posts, modules) from the bundled curriculum? Your edits to those tables will be replaced.")) return;
    setReseedBusy(true);
    try {
      const res = await reseedContent();
      showToast(res.message || "Content restored");
      loadDb();
      if (openTable) loadTable(openTable);
      if (activeTab === "content") loadResource(resource);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Reseed failed");
    } finally {
      setReseedBusy(false);
    }
  };

  /* ============================ LOGIN SCREEN ============================ */
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md w-full mx-auto px-4 py-24">
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center gap-4 mb-6">
              {/* Company logo — transparent, NO background box */}
              <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited Logo" className="w-16 h-16 object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-black text-white">Seedwel Admin Portal</h1>
                <p className="text-xs text-amber-400 font-semibold">Seedwel Investment Limited • Management Only</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Sign in with a management Firebase account to control the full database, registered
              students, content, investor deal flow and every private API.
            </p>

            {notAdmin && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This account (<b>{user?.email}</b>) is not on the management allowlist. Sign out and
                  use an approved admin account.
                </span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seedwell@seedwel.com"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your Firebase account password"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              {loginError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || authLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
              >
                {loginLoading || authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {loginLoading || authLoading ? "Verifying…" : "Sign In to Management Hub"}
              </button>
            </form>

            {signedIn && (
              <button onClick={handleLogout} className="mt-3 w-full text-xs text-gray-500 hover:text-rose-300 transition-colors">
                Sign out of {user?.email}
              </button>
            )}

            <div className="mt-6 border-t border-gray-800/80 pt-4 space-y-3">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                <span className="font-bold text-gray-400">Setup:</span> in Firebase Console → project{" "}
                <code className="text-amber-400 font-mono">seedwel-cbeb8</code> → Authentication, enable{" "}
                <b>Email/Password</b> and create the management accounts. Admin emails:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_EMAILS.slice(0, 3).map((e) => (
                  <code key={e} className="rounded bg-gray-950 border border-gray-800 px-2 py-0.5 text-[10px] text-amber-400/90 font-mono">
                    {e}
                  </code>
                ))}
              </div>
              {import.meta.env.DEV && (
                <button
                  onClick={handleDevLogin}
                  disabled={loginLoading}
                  className="w-full mt-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2.5 text-xs font-bold text-sky-300 transition-colors"
                >
                  Development preview sign-in (local only)
                </button>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ============================ ADMIN DASHBOARD ============================ */
  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "users", label: "Registered Users", icon: Users, badge: users.length || overview?.users?.length || 0 },
    { id: "content", label: "Content Manager", icon: FileEdit },
    { id: "inbox", label: "Inbox & Deal Flow", icon: Inbox, badge: (overview?.investorInquiries.length || 0) + (overview?.messages.length || 0) },
    { id: "database", label: "Database Console", icon: Database },
    { id: "advisor", label: "Upgrade Advisor", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-emerald-500/95 text-gray-950 font-bold text-sm px-5 py-3 shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800/80 bg-gray-900/60 pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Transparent company logo — no background box */}
              <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-14 h-14 object-contain shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-white">Seedwel Executive Admin</h1>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    Registered 2025 • Active
                  </span>
                  {sessionKind === "dev" && (
                    <span className="rounded-full bg-sky-500/20 border border-sky-500/40 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                      DEV SESSION
                    </span>
                  )}
                </div>
                <p className="text-sm text-amber-400 font-medium mt-0.5">
                  {profile?.name || user?.displayName || "Management"} •{" "}
                  <span className="text-gray-400">{profile?.email || user?.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadOverview();
                  loadDb();
                  loadUsers();
                }}
                disabled={loadingData}
                className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loadingData && "animate-spin")} />
                Refresh Data
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-gray-800/60 pt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                  activeTab === t.id
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent"
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {!!t.badge && (
                  <span className="ml-1 rounded-full bg-amber-500 text-gray-950 px-1.5 py-0.5 text-[10px] font-black">{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {dataError && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {dataError}
          </div>
        )}

        {/* ==================== OVERVIEW ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  <img src="/images/seedwel-logo.svg" alt="Seedwel logo" className="w-16 h-16 object-contain hidden sm:block" />
                  <div>
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Official Corporate Profile</span>
                    <h2 className="text-3xl font-black text-white mt-1">Seedwel Investment Limited</h2>
                    <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                      Officially registered in 2025. Institutional-grade investment platform open for
                      investors in educational infrastructure (school building), artificial intelligence
                      solutions & developers, and the strategic wealth curriculum.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Founder & CEO</div>
                    <div className="text-sm font-bold text-white mt-0.5">Mr. Seedwell Khayalethu Masuku</div>
                    <div className="text-[11px] text-amber-400">seedwell@seedwel.com</div>
                  </div>
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Country Director</div>
                    <div className="text-sm font-bold text-white mt-0.5">Zacheus Simbaya</div>
                    <div className="text-[11px] text-amber-400">Zambia Regional HQ</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-6 border-t border-gray-800/80 pt-6">
                {(
                  [
                    [Building2, "School Building", "15 STEM & AI Schools in Zambia"],
                    [Cpu, "AI Business & Developers", "SaaS Incubator & Developer Academy"],
                    [TrendingUp, "Wealth Curriculum", "28 Lessons & 7 Masterclasses"],
                  ] as [React.ElementType, string, string][]
                ).map(([Icon, title, sub], i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{title}</div>
                      <div className="text-[11px] text-gray-400">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Platform & Database Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(
                  [
                    ["Registered Users", users.length || overview?.users?.length || 0, Users],
                    ["Curriculum Lessons", overview?.stats.lessons ?? 28, Award],
                    ["Investor Inquiries", overview?.investorInquiries.length ?? 0, Briefcase],
                    ["Contact Messages", overview?.messages.length ?? 0, MessageSquare],
                  ] as [string, number, React.ElementType][]
                ).map(([label, val, Icon], idx) => (
                  <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                      <span>{label}</span>
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white mt-2">{val}</div>
                    <div className="text-xs text-gray-500 mt-1">Live from the database</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick access panels */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Strategic Roadmap Advisory</h3>
                  <button onClick={() => setActiveTab("advisor")} className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((r) => (
                    <div key={r.id} className="rounded-xl bg-gray-950/80 border border-gray-800/80 p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{r.actionType}</span>
                        <span className="text-xs font-bold text-white">{r.title}</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Latest Deal Flow</h3>
                  <button onClick={() => setActiveTab("inbox")} className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1">
                    Open Inbox <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {overview?.investorInquiries?.length ? (
                  <div className="space-y-3">
                    {overview.investorInquiries.slice(0, 3).map((inq) => (
                      <div key={inq.id} className="rounded-xl bg-gray-950/80 border border-gray-800/80 p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{inq.name}</span>
                          <span className="text-[11px] text-emerald-400 font-semibold">{inq.amount_range}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{inq.interest_area}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs border border-dashed border-gray-800 rounded-2xl py-6 text-center">
                    No investor inquiries yet — they arrive from the Invest page.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== USERS ==================== */}
        {activeTab === "users" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Registered Users <span className="text-amber-400 font-mono">({users.length})</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Every student who registered via Firebase Authentication. Grant or revoke management rights.
                </p>
              </div>
              <button onClick={loadUsers} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {users.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-gray-800 rounded-2xl">
                <GraduationCap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">No registered users yet</p>
                <p className="text-gray-500 text-xs mt-1">Students appear here after their first sign-in.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.uid} className="rounded-2xl bg-gray-950/80 border border-gray-800 p-4 flex flex-wrap items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-sm shrink-0">
                      {(u.name || u.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{u.name || "Unnamed Student"}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                            u.role === "admin"
                              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          )}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email || u.uid}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        uid: {u.uid.slice(0, 18)}… • last seen {u.last_seen ? new Date(u.last_seen).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const nextRole = u.role === "admin" ? "student" : "admin";
                          await setAdminUserRole(u.uid, nextRole);
                          showToast(`${u.name || u.email} is now ${nextRole}`);
                          loadUsers();
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                          u.role === "admin"
                            ? "bg-gray-800 hover:bg-gray-700 text-gray-300"
                            : "bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                        )}
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        {u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Remove ${u.email || u.uid} from the users table?`)) return;
                          await deleteAdminUser(u.uid);
                          showToast("User removed");
                          loadUsers();
                        }}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-2 text-rose-300 transition-colors"
                        aria-label="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== CONTENT MANAGER ==================== */}
        {activeTab === "content" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Content Manager</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Create, edit and delete anything the site serves — every change writes straight to the database.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReseed}
                  disabled={reseedBusy}
                  className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 text-xs font-bold text-sky-300 transition-colors disabled:opacity-50"
                >
                  {reseedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Restore Default Content
                </button>
                <button
                  onClick={() => openRecordEditor("new")}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-4 py-2 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> New {RESOURCE_META[resource].label.slice(0, -1)}
                </button>
              </div>
            </div>

            {/* Resource picker */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(RESOURCE_META) as ContentResource[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setResource(r)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-bold transition-all",
                    resource === r
                      ? "bg-amber-500 text-gray-950"
                      : "bg-gray-800/80 text-gray-400 hover:text-white"
                  )}
                >
                  {RESOURCE_META[r].label}
                </button>
              ))}
            </div>

            {recordsLoading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading {RESOURCE_META[resource].label}…
              </div>
            ) : (
              <div className="space-y-2.5">
                {records.map((rec) => {
                  const meta = RESOURCE_META[resource];
                  const id = String(rec[meta.idField]);
                  return (
                    <div key={id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{meta.titleOf(rec)}</div>
                        <div className="text-[11px] text-gray-500 font-mono truncate">{id}</div>
                      </div>
                      <button
                        onClick={() => openRecordEditor("edit", rec)}
                        className="flex items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-2 text-xs font-bold text-gray-200 transition-colors"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => removeRecord(rec)}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-2 text-rose-300 transition-colors"
                        aria-label="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {records.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-800 rounded-2xl">
                    No {RESOURCE_META[resource].label.toLowerCase()} in the database.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== INBOX ==================== */}
        {activeTab === "inbox" && overview && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Investor inquiries */}
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Investors{" "}
                <span className="text-amber-400 font-mono text-sm">({overview.investorInquiries.length})</span>
              </h2>
              <div className="space-y-3">
                {overview.investorInquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{inq.name}</div>
                        <div className="text-[11px] text-amber-400 truncate">{inq.interest_area}</div>
                        <div className="text-[11px] text-gray-500 truncate">{inq.email}{inq.phone ? ` • ${inq.phone}` : ""}</div>
                        {inq.amount_range && <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">{inq.amount_range}</div>}
                        {inq.message && <p className="text-[11px] text-gray-400 mt-1.5 italic">"{inq.message}"</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteRow("investor_inquiries", { id: inq.id })}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0"
                        aria-label="Delete inquiry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {overview.investorInquiries.length === 0 && <p className="text-gray-500 text-xs">No investor inquiries.</p>}
              </div>
            </div>

            {/* Contact messages */}
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" /> Messages{" "}
                <span className="text-amber-400 font-mono text-sm">({overview.messages.length})</span>
              </h2>
              <div className="space-y-3">
                {overview.messages.map((m) => (
                  <div key={m.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{m.name} <span className="text-gray-500 font-normal">• {m.subject}</span></div>
                        <div className="text-[11px] text-amber-400">{m.email}</div>
                        <p className="text-[11px] text-gray-400 mt-1">{m.message}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteRow("contact_messages", { id: m.id })}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0"
                        aria-label="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {overview.messages.length === 0 && <p className="text-gray-500 text-xs">No messages.</p>}
              </div>
            </div>

            {/* Subscribers */}
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" /> Subscribers{" "}
                <span className="text-amber-400 font-mono text-sm">({overview.subscribers.length})</span>
              </h2>
              <div className="space-y-2">
                {overview.subscribers.map((s) => (
                  <div key={s.id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-white truncate">{s.email}</div>
                      <div className="text-[10px] text-gray-600">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteRow("subscribers", { id: s.id })}
                      className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0"
                      aria-label="Delete subscriber"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {overview.subscribers.length === 0 && <p className="text-gray-500 text-xs">No subscribers.</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== DATABASE CONSOLE ==================== */}
        {activeTab === "database" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <img src="/images/seedwel-logo.svg" alt="Seedwel logo" className="w-12 h-12 object-contain hidden sm:block" />
                  <div>
                    <h2 className="text-2xl font-black text-white">Seedwel Database Console</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Engine: <code className="text-amber-400 font-mono">{dbInfo?.engine || "…"}</code>
                      {dbInfo?.firebaseProject && (
                        <> • Firebase project: <code className="text-amber-400 font-mono">{dbInfo.firebaseProject}</code></>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/api-docs"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-all"
                  >
                    Open API Explorer <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={loadDb} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {/* Table chips */}
              <div className="flex flex-wrap gap-2">
                {dbInfo?.tables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => loadTable(t.name)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono transition-all border",
                      openTable === t.name
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-gray-950/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                    )}
                  >
                    <Table2 className="w-3.5 h-3.5" />
                    {t.name}
                    <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] font-black text-white">{t.count}</span>
                  </button>
                ))}
                {!dbInfo && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reading database…
                  </div>
                )}
              </div>
            </div>

            {/* Rows */}
            {openTable && (
              <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 font-mono">
                  {openTable} <span className="text-amber-400">({tableRows.length} rows)</span>
                </h3>
                {tableLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading rows…
                  </div>
                ) : tableRows.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Table is empty.</p>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {tableRows.map((row, i) => (
                      <div key={i} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 flex items-start gap-3">
                        <pre className="flex-1 min-w-0 text-[11px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(row, null, 1).slice(0, 1200)}
                          {JSON.stringify(row).length > 1200 ? " …" : ""}
                        </pre>
                        <button
                          onClick={() => handleDeleteRow(openTable, row)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0"
                          aria-label="Delete row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== ADVISOR ==================== */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> Management Advisory Engine
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    What to Upgrade or Add to <span className="text-amber-400">Seedwel</span>
                  </h2>
                  <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                    Tailored recommendations for Mr. Seedwell Khayalethu Masuku and Zacheus Simbaya.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {["All", "School Building", "AI & Developers", "Investor Deal Flow", "Curriculum", "Technical"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setRecFilter(cat)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        recFilter === cat ? "bg-amber-500 text-gray-950 font-bold" : "bg-gray-800/80 text-gray-400 hover:text-white"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {filteredRecs.map((r) => {
                  const status = recStatusMap[r.id] || "Recommended";
                  return (
                    <div key={r.id} className="rounded-2xl bg-gray-950/80 border border-gray-800/80 hover:border-amber-500/40 p-6 transition-all">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2 max-w-3xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">
                              {r.actionType}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                r.priority === "High"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : r.priority === "Strategic"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                    : "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                              )}
                            >
                              Priority: {r.priority}
                            </span>
                            <span className="text-xs font-semibold text-gray-400">• {r.category}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{r.title}</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{r.description}</p>
                          <div className="rounded-xl bg-gray-900/90 border border-gray-800 p-3 text-xs text-amber-400 font-medium">
                            <span className="text-gray-400 font-semibold">Expected Impact: </span>
                            {r.impact}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => toggleRecStatus(r.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                              status === "Completed"
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                                : status === "In Progress"
                                  ? "bg-sky-500/20 border border-sky-500/40 text-sky-300"
                                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                            )}
                          >
                            {status === "Completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {status === "In Progress" && <Clock className="w-3.5 h-3.5 text-sky-400" />}
                            {status === "Recommended" && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                            Status: {status}
                          </button>
                          <span className="text-[10px] text-gray-500">Click to change progress</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== RECORD EDITOR MODAL ==================== */}
      {editor && (
        <div className="fixed inset-0 z-[70] bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="w-full max-w-3xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div>
                <h3 className="font-black text-white">
                  {editor.mode === "new" ? `New ${RESOURCE_META[resource].label.slice(0, -1)}` : `Edit ${RESOURCE_META[resource].label.slice(0, -1)}`}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Edit the JSON record — it is saved directly into the <code className="text-amber-400 font-mono">{resource}</code> table.
                </p>
              </div>
              <button onClick={() => setEditor(null)} className="rounded-lg bg-gray-800 hover:bg-gray-700 p-2 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={editor.text}
                onChange={(e) => setEditor({ ...editor, text: e.target.value })}
                spellCheck={false}
                className="w-full h-[50vh] rounded-2xl bg-gray-950 border border-gray-800 p-4 text-xs text-emerald-300 font-mono focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
              />
              {editorError && (
                <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{editorError}</div>
              )}
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={() => setEditor(null)} className="rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2.5 text-xs font-bold text-gray-300">
                  Cancel
                </button>
                <button
                  onClick={saveRecord}
                  disabled={savingRecord}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-5 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-60"
                >
                  {savingRecord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingRecord ? "Saving…" : "Save to Database"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
