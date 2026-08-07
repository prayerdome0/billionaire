import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Lock,
  Mail,
  Key,
  LogOut,
  RefreshCw,
  Building2,
  Cpu,
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Database,
  Users,
  MessageSquare,
  Award,
  PlusCircle,
  Clock,
  ExternalLink,
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
  DollarSign,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth, authErrorMessage, ADMIN_EMAILS } from "../lib/auth";
import {
  fetchAdminOverview,
  fetchAdminRecommendations,
  fetchAdminUsers,
  setAdminUserRole,
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
import {
  listAllUsersFirestore,
  subscribeToAdmins,
  setUserRoleFirestore,
  seedFirestoreFromBundledContent,
  listCertificatesFirestore,
  listPendingPaymentsFirestore,
  markCertificateSentByAdmin,
  rejectPaymentByAdmin,
  isCertificateIssued,
  isCertificateAwaitingAdmin,
  CERTIFICATE_DELIVERY_WINDOW_HOURS,
  type FirestoreUser,
  type CertificateClaim,
  type PaymentRecord,
} from "../lib/firestoreDb";
import { CERTIFICATE_FEE } from "../lib/certificateService";

type Tab = "overview" | "users" | "content" | "certificates" | "payments" | "inbox" | "database" | "advisor";

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
  investor_inquiries: "id", lesson_progress: "id", users: "uid", certificates: "id", certificate_payments: "id",
};

export default function AdminPage() {
  const { user, loading: authLoading, isAdmin, profile, firestoreUser, sessionKind, signIn, logout } = useAuth();
  const signedIn = !!user;

  const [email, setEmail] = useState("");
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
  const [fsUsers, setFsUsers] = useState<FirestoreUser[]>([]);
  const [fsAdmins, setFsAdmins] = useState<FirestoreUser[]>([]);
  const [certClaims, setCertClaims] = useState<CertificateClaim[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([]);
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
  const [firestoreSeedBusy, setFirestoreSeedBusy] = useState(false);
  const [approvingPaymentId, setApprovingPaymentId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3500);
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
      const [apiUsers, fUsers] = await Promise.all([fetchAdminUsers().catch(() => [] as RegisteredUser[]), listAllUsersFirestore().catch(() => [] as FirestoreUser[])]);
      setUsers(apiUsers);
      setFsUsers(fUsers);
      const fsAdminsList = fUsers.filter((u) => u.role === "admin");
      setFsAdmins(fsAdminsList);
    } catch {}
  }, []);

  const loadDb = useCallback(async () => {
    try {
      setDbInfo(await fetchAdminDatabase());
    } catch {}
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

  const loadCertificates = useCallback(async () => {
    try {
      const certs = await listCertificatesFirestore();
      setCertClaims(certs);
    } catch {}
  }, []);

  const loadPendingPayments = useCallback(async () => {
    try {
      const payments = await listPendingPaymentsFirestore();
      setPendingPayments(payments);
    } catch {}
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadOverview();
      loadDb();
      loadUsers();
      loadCertificates();
      loadPendingPayments();
    }
  }, [isAdmin, loadOverview, loadDb, loadUsers, loadCertificates, loadPendingPayments]);

  useEffect(() => {
    if (isAdmin && activeTab === "content") loadResource(resource);
  }, [isAdmin, activeTab, resource, loadResource]);

  useEffect(() => {
    if (isAdmin && (activeTab === "users" || activeTab === "database" || activeTab === "certificates" || activeTab === "payments")) {
      loadUsers();
      loadDb();
      loadCertificates();
      if (activeTab === "payments") loadPendingPayments();
    }
  }, [isAdmin, activeTab, loadUsers, loadDb, loadCertificates, loadPendingPayments]);

  // real-time admins
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeToAdmins((admins) => setFsAdmins(admins));
    return () => unsub();
  }, [isAdmin]);

  /* ---------------- actions ---------------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setNotAdmin(false);
    setLoginLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setLoginError(authErrorMessage(err));
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
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
        if (recFilter === "Payment" && r.category.includes("Payment")) return true;
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
    if (!window.confirm("Restore ALL content tables from bundled curriculum? Your edits will be replaced.")) return;
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

  const handleFirestoreSeed = async () => {
    if (!window.confirm("Seed Firebase Firestore TRUE DATABASE with bundled curriculum? This will write 28 lessons, 6 modules, etc to Firestore collections (lessons, modules, videos, niches, founders, posts).")) return;
    setFirestoreSeedBusy(true);
    try {
      const res = await seedFirestoreFromBundledContent();
      showToast(`Firestore seeded: ${res.seeded} docs written to Firebase true DB`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Firestore seed failed — check rules");
    } finally {
      setFirestoreSeedBusy(false);
    }
  };

  /* ---------------- certificate quotation / manual delivery actions ---------------- */
  const handleMarkCertificateSent = async (payment: PaymentRecord) => {
    const sent = window.confirm(
      `Before continuing, send the certificate to ${payment.email} through the official email channel.\n\n` +
        `Click OK only after payment has been verified and the certificate has been sent. This records the delivery; it does not send email automatically.`
    );
    if (!sent) return;
    const deliveryNote = window.prompt("Optional delivery note for the student:", "Certificate sent to registered email");
    if (deliveryNote === null) return;

    setApprovingPaymentId(payment.id);
    try {
      await markCertificateSentByAdmin({
        uid: payment.uid,
        paymentId: payment.id,
        method: (payment.method as any) || "manual",
        adminUid: user?.uid,
        deliveryNote,
      });
      showToast(`Certificate marked sent to ${payment.email}`);
      loadPendingPayments();
      loadCertificates();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not record certificate delivery");
    } finally {
      setApprovingPaymentId(null);
    }
  };

  const handleRejectPayment = async (payment: PaymentRecord) => {
    const reason = window.prompt("Reason for rejection (optional):", "Payment not verified");
    if (reason === null) return; // cancelled
    setApprovingPaymentId(payment.id);
    try {
      await rejectPaymentByAdmin({
        uid: payment.uid,
        paymentId: payment.id,
        reason: reason || "Rejected by admin",
      });
      showToast(`Payment rejected for ${payment.email}`);
      loadPendingPayments();
      loadCertificates();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setApprovingPaymentId(null);
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
              <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited Logo" className="w-16 h-16 object-contain shrink-0" />
              <div>
                <h1 className="text-xl font-black text-white">Seedwel Admin Portal</h1>
                <p className="text-xs text-amber-400 font-semibold">Seedwel Investment Limited • Management Only • Firestore role</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Sign in with a management Firebase account (role=admin in users/{"{uid}"}). Admin detection happens in student dashboard via Firestore true database. Tuition FREE, certificate ${CERTIFICATE_FEE} paid.
            </p>
            {notAdmin && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This account (<b>{user?.email}</b>) is not admin. Firestore users/{"{uid}"} role is {firestoreUser?.role || "student"}. Ask existing admin to set role=admin.
                </span>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Email (Firestore role field)</label>
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
                {loginLoading || authLoading ? "Verifying Firestore role…" : "Sign In — Check Firestore Admin Role"}
              </button>
            </form>
            {signedIn && (
              <button onClick={handleLogout} className="mt-3 w-full text-xs text-gray-500 hover:text-rose-300 transition-colors">
                Sign out of {user?.email} (Firestore role: {firestoreUser?.role})
              </button>
            )}
            <div className="mt-6 border-t border-gray-800/80 pt-4 space-y-3">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Setup: Firebase Console → project <code className="text-amber-400">seedwel-cbeb8</code> → Firestore → users collection → set <code className="text-amber-400">role=admin</code> for founder emails. Detection in student dashboard reads users/{"{uid}"}.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ADMIN_EMAILS.slice(0, 3).map((e) => (
                  <code key={e} className="rounded bg-gray-950 border border-gray-800 px-2 py-0.5 text-[10px] text-amber-400/90 font-mono">
                    {e}
                  </code>
                ))}
              </div>
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
    { id: "users", label: "Users (Firestore role)", icon: Users, badge: fsUsers.length || users.length || 0 },
    { id: "certificates", label: `Certificates $${CERTIFICATE_FEE}`, icon: Award, badge: certClaims.length },
    { id: "payments", label: "Certificate Requests", icon: CreditCard, badge: pendingPayments.length || 0 },
    { id: "content", label: "Content Manager", icon: FileEdit },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: (overview?.investorInquiries.length || 0) + (overview?.messages.length || 0) },
    { id: "database", label: "True DB Console", icon: Database },
    { id: "advisor", label: "Advisor", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] rounded-xl bg-emerald-500/95 text-gray-950 font-bold text-sm px-5 py-3 shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {toast}
        </div>
      )}

      <div className="border-b border-gray-800/80 bg-gray-900/60 pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/images/seedwel-logo.svg" alt="Seedwel" className="w-14 h-14 object-contain shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-white">Seedwel Executive Admin — Firestore True DB</h1>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">Cert Incorporation • No school yet</span>
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">Tuition FREE • Cert ${CERTIFICATE_FEE}</span>
                </div>
                <p className="text-sm text-amber-400 font-medium mt-0.5">
                  {profile?.name || firestoreUser?.name || user?.displayName || "Management"} •{" "}
                  <span className="text-gray-400">{profile?.email || firestoreUser?.email || user?.email} • role: {firestoreUser?.role || profile?.role}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadOverview();
                  loadDb();
                  loadUsers();
                  loadCertificates();
                  loadPendingPayments();
                }}
                disabled={loadingData}
                className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loadingData && "animate-spin")} />
                Refresh True DB
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>

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
                <t.icon className="w-3.5 h-3.5" /> {t.label} {!!t.badge && <span className="ml-1 rounded-full bg-amber-500 text-gray-950 px-1.5 py-0.5 text-[10px] font-black">{t.badge}</span>}
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

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  <img src="/images/seedwel-logo.svg" alt="Seedwel logo" className="w-16 h-16 object-contain hidden sm:block" />
                  <div>
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4" /> Certificate Incorporation • Est. 2025 • True DB: Firestore
                    </span>
                    <h2 className="text-3xl font-black text-white mt-1">Seedwel Investment Limited</h2>
                    <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                      Tuition is <span className="text-emerald-300 font-bold">FREE</span> for all 28 lessons. Certificate claim is{" "}
                      <span className="text-amber-300 font-bold">${CERTIFICATE_FEE} USD</span> paid — verification, registry, incorporation admin. No physical school built yet. Firestore users/{"{uid}"} role field is source of truth for admin detection in student dashboard.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Founder & CEO</div>
                    <div className="text-sm font-bold text-white mt-0.5">Mr. Seedwell Khayalethu Masuku</div>
                    <div className="text-[11px] text-amber-400">role: admin (Firestore)</div>
                  </div>
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Country Director</div>
                    <div className="text-sm font-bold text-white mt-0.5">Zacheus Simbaya</div>
                    <div className="text-[11px] text-amber-400">Zambia • admin</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mt-6 border-t border-gray-800/80 pt-6">
                {(
                  [
                    [Building2, "School Building", "Incorporation phase — no school yet"],
                    [Cpu, "AI Business & Devs", "SaaS Incubator & Academy"],
                    [DollarSign, `Certificate $${CERTIFICATE_FEE} Paid`, "Tuition FREE, cert paid"],
                    [Database, "True Database", "Firestore — users, progress, certs"],
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

            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                Platform & True Database Metrics{" "}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">Firestore: seedwel-cbeb8</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(
                  [
                    ["Registered Users", fsUsers.length || users.length || overview?.users?.length || 0, Users],
                    ["Admins (role=admin)", fsAdmins.length, ShieldCheck],
                    ["Certificate Claims", certClaims.length, Award],
                    ["Pending Certificate Requests", pendingPayments.length, Clock],
                    ["Certificates Sent", certClaims.filter((c) => isCertificateIssued(c)).length, CreditCard],
                  ] as [string, any, React.ElementType][]
                ).map(([label, val, Icon], idx) => (
                  <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                      <span>{label}</span>
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white mt-2">{val}</div>
                    <div className="text-xs text-gray-500 mt-1">Live Firestore true DB</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" /> Management (Firestore admins)
                  </h3>
                </div>
                <div className="space-y-2">
                  {fsAdmins.slice(0, 5).map((a) => (
                    <div key={a.uid} className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-gray-950 font-black text-xs">
                        {(a.name || a.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{a.name || a.email}</div>
                        <div className="text-[11px] text-amber-400/70 font-mono truncate">role=admin • {a.email}</div>
                      </div>
                    </div>
                  ))}
                  {fsAdmins.length === 0 && <p className="text-gray-500 text-xs">No admins detected — promote via Users tab.</p>}
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" /> Recent Certificate Claims (${CERTIFICATE_FEE})
                  </h3>
                </div>
                <div className="space-y-2">
                  {certClaims.slice(0, 5).map((c) => (
                    <div key={c.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{c.nameOnCertificate || c.email}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{c.certificateNumber} • {c.completedLessons}/{c.totalLessons}</div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCertificateIssued(c) ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
                        {isCertificateIssued(c) ? "SENT" : isCertificateAwaitingAdmin(c) ? "ADMIN QUEUE" : `READY $${c.feeUsd}`}
                      </span>
                    </div>
                  ))}
                  {certClaims.length === 0 && <p className="text-gray-500 text-xs">No certificate claims yet — students send a ${CERTIFICATE_FEE} payment quotation after completion.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Registered Users — Firestore Role Source <span className="text-amber-400 font-mono">({fsUsers.length || users.length})</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  True database: Firestore <code className="text-amber-400">users/</code> collection. Role field (admin|student) controls Admin tab in student dashboard.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => loadUsers()} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Firestore
                </button>
                <button
                  onClick={handleFirestoreSeed}
                  disabled={firestoreSeedBusy}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50"
                >
                  {firestoreSeedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />} Seed Firestore True DB
                </button>
              </div>
            </div>

            {/* Merge API users + Firestore users */}
            <div className="space-y-3">
              {(fsUsers.length ? fsUsers : users.map((u) => ({ uid: u.uid, email: u.email, name: u.name, role: u.role as any, lastSeen: u.last_seen } as FirestoreUser))).map(
                (u: any) => (
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
                            u.role === "admin" ? "bg-amber-500/20 border border-amber-500/40 text-amber-300" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          )}
                        >
                          {u.role} • Firestore
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email || u.uid}</div>
                      <div className="text-[10px] text-gray-600 mt-0.5">uid: {u.uid.slice(0, 18)}… • lastSeen Firestore</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const nextRole = u.role === "admin" ? "student" : "admin";
                          try {
                            // update API + Firestore
                            await setAdminUserRole(u.uid, nextRole).catch(() => {});
                            await setUserRoleFirestore(u.uid, nextRole);
                            showToast(`${u.name || u.email} is now ${nextRole} in Firestore (true DB)`);
                          } catch (e) {
                            showToast((e as Error).message);
                          }
                          loadUsers();
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                          u.role === "admin" ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                        )}
                      >
                        <UserCog className="w-3.5 h-3.5" /> {u.role === "admin" ? "Revoke Admin (Firestore)" : "Make Admin (Firestore role)"}
                      </button>
                    </div>
                  </div>
                )
              )}
              {((fsUsers.length || users.length) === 0) && (
                <div className="text-center py-14 border border-dashed border-gray-800 rounded-2xl">
                  <GraduationCap className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-semibold">No users in Firestore yet</p>
                  <p className="text-gray-500 text-xs mt-1">Students appear after first sign-in — tuition FREE.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "certificates" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Award className="w-6 h-6 text-amber-400" /> Certificate Claims — ${CERTIFICATE_FEE} Quotation Workflow
                </h2>
                <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                  Students learn FREE. Eligible students send a ${CERTIFICATE_FEE} USD payment quotation to this admin queue; after payment verification, an admin sends the certificate to the registered email within ${CERTIFICATE_DELIVERY_WINDOW_HOURS} hours. True DB: Firestore certificates collection.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs">
                  <div className="text-emerald-300 font-bold">Revenue from certs</div>
                  <div className="text-white font-black">${certClaims.filter((c) => c.paid).length * CERTIFICATE_FEE}</div>
                </div>
                <button onClick={loadCertificates} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl bg-gray-950/70 border border-gray-800 p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Total Claims</div>
                <div className="text-2xl font-black text-white mt-1">{certClaims.length}</div>
                <div className="text-[11px] text-gray-600">Firestore certificates collection</div>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="text-xs text-emerald-300 uppercase tracking-wider">Certificates sent</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{certClaims.filter((c) => isCertificateIssued(c)).length}</div>
                <div className="text-[11px] text-emerald-200/60">${certClaims.filter((c) => c.paid).length * CERTIFICATE_FEE} payment verified</div>
              </div>
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="text-xs text-amber-300 uppercase tracking-wider">Awaiting admin</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{certClaims.filter((c) => isCertificateAwaitingAdmin(c)).length}</div>
                <div className="text-[11px] text-amber-200/60">Quotation / payment verification queue</div>
              </div>
            </div>

            <div className="space-y-2.5">
              {certClaims.map((c) => (
                <div key={c.id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 flex flex-wrap items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-sm">
                    {(c.nameOnCertificate || c.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-sm font-bold text-white truncate">{c.nameOnCertificate}</div>
                    <div className="text-[11px] text-gray-400 truncate">{c.email} • {c.certificateNumber}</div>
                    <div className="text-[10px] text-gray-600 font-mono">{c.completedLessons}/{c.totalLessons} • {c.percentage}% • {c.paymentStatus} • Firestore</div>
                    {c.cloudinaryUrl && (
                      <a
                        href={c.cloudinaryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-semibold hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Cloudinary PDF (samples/ecommerce)
                      </a>
                    )}
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isCertificateIssued(c) ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" : "bg-amber-500/20 border border-amber-500/40 text-amber-300"}`}>
                    {isCertificateIssued(c) ? "SENT" : isCertificateAwaitingAdmin(c) ? "ADMIN QUEUE" : `READY $${c.feeUsd}`}
                  </span>
                </div>
              ))}
              {certClaims.length === 0 && <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-800 rounded-2xl">No certificate claims in Firestore yet — eligible students send a payment quotation after 28 lessons.</p>}
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-amber-400" /> Certificate Requests — Send Within {CERTIFICATE_DELIVERY_WINDOW_HOURS} Hours
                </h2>
                <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                  Students send a ${CERTIFICATE_FEE} payment quotation and their preferred payment method here. Verify the payment, send the certificate through the official email channel, then mark it sent below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs">
                  <div className="text-amber-300 font-bold">Awaiting action</div>
                  <div className="text-white font-black">{pendingPayments.length}</div>
                </div>
                <button onClick={loadPendingPayments} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3 text-xs text-sky-200/70 flex gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span><b className="text-sky-300">Manual delivery:</b> this portal tracks the request and delivery status. It does not send email automatically—use the student’s registered email, then click “Mark Certificate Sent.”</span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-gray-800 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">No pending certificate requests</p>
                <p className="text-gray-500 text-xs mt-1">All submitted quotations have been reviewed and delivered or declined.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPayments.map((p) => (
                  <div key={p.id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-4 flex flex-wrap items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-sm">
                      {(p.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-bold text-white truncate">{p.email}</div>
                      <div className="text-[11px] text-amber-300/80 font-mono">
                        {p.quotationNumber || p.id} • preferred: {p.method || "manual"} • ${p.amountUsd} USD
                      </div>
                      {certClaims.find((c) => c.uid === p.uid) && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Certificate: <b className="text-white">{certClaims.find((c) => c.uid === p.uid)?.nameOnCertificate}</b> • {" "}
                          <code className="text-amber-300/70">{certClaims.find((c) => c.uid === p.uid)?.certificateNumber}</code>
                        </div>
                      )}
                      <div className="text-[10px] text-gray-600 font-mono">
                        uid: {p.uid.slice(0, 18)}… • {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : "submitted"}
                      </div>
                      <div className="text-[10px] text-sky-300/70 mt-1">Target: send certificate within {p.deliveryWindowHours || CERTIFICATE_DELIVERY_WINDOW_HOURS} hours of this quotation.</div>
                    </div>
                    <span className="rounded-full px-3 py-1 text-[11px] font-black bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      QUOTATION PENDING
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`mailto:${p.email}?subject=${encodeURIComponent(`Seedwel Certificate — ${p.quotationNumber || p.id}`)}`}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" /> Email Student
                      </a>
                      <button
                        onClick={() => handleMarkCertificateSent(p)}
                        disabled={approvingPaymentId === p.id}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                      >
                        {approvingPaymentId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Mark Certificate Sent
                      </button>
                      <button
                        onClick={() => handleRejectPayment(p)}
                        disabled={approvingPaymentId === p.id}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 transition-all disabled:opacity-50"
                      >
                        {approvingPaymentId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Decline Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "content" && (
          <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-white">Content Manager — Firestore True DB</h2>
                <p className="text-gray-400 text-sm mt-1">Edits write to backup DB + Firestore collections (lessons, modules, videos, etc). Tuition FREE content.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleFirestoreSeed} disabled={firestoreSeedBusy} className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50">
                  {firestoreSeedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />} Seed Firestore
                </button>
                <button onClick={handleReseed} disabled={reseedBusy} className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 text-xs font-bold text-sky-300 disabled:opacity-50">
                  {reseedBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Restore Default Content
                </button>
                <button onClick={() => openRecordEditor("new")} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-4 py-2 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all">
                  <PlusCircle className="w-3.5 h-3.5" /> New {RESOURCE_META[resource].label.slice(0, -1)}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {(Object.keys(RESOURCE_META) as ContentResource[]).map((r) => (
                <button key={r} onClick={() => setResource(r)} className={cn("rounded-xl px-4 py-2 text-xs font-bold transition-all", resource === r ? "bg-amber-500 text-gray-950" : "bg-gray-800/80 text-gray-400 hover:text-white")}>
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
                        <div className="text-[11px] text-gray-500 font-mono truncate">{id} • Firestore true DB</div>
                      </div>
                      <button onClick={() => openRecordEditor("edit", rec)} className="flex items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 px-3 py-2 text-xs font-bold text-gray-200 transition-colors">
                        <FileEdit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => removeRecord(rec)} className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-2 text-rose-300 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {records.length === 0 && <p className="text-gray-500 text-sm text-center py-8 border border-dashed border-gray-800 rounded-2xl">No {RESOURCE_META[resource].label.toLowerCase()} in the database.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === "inbox" && overview && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" /> Investors <span className="text-amber-400 font-mono text-sm">({overview.investorInquiries.length})</span>
              </h2>
              <div className="space-y-3">
                {overview.investorInquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{inq.name}</div>
                        <div className="text-[11px] text-amber-400 truncate">{inq.interest_area}</div>
                        <div className="text-[11px] text-gray-500 truncate">{inq.email}</div>
                      </div>
                      <button onClick={() => handleDeleteRow("investor_inquiries", { id: inq.id })} className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" /> Messages <span className="text-amber-400 font-mono text-sm">({overview.messages.length})</span>
              </h2>
              <div className="space-y-3">
                {overview.messages.map((m) => (
                  <div key={m.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white">{m.name} • {m.subject}</div>
                        <div className="text-[11px] text-amber-400">{m.email}</div>
                        <p className="text-[11px] text-gray-400 mt-1">{m.message}</p>
                      </div>
                      <button onClick={() => handleDeleteRow("contact_messages", { id: m.id })} className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" /> Subscribers <span className="text-amber-400 font-mono text-sm">({overview.subscribers.length})</span>
              </h2>
              <div className="space-y-2">
                {overview.subscribers.map((s) => (
                  <div key={s.id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-3.5 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-white truncate">{s.email}</div>
                      <div className="text-[10px] text-gray-600">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => handleDeleteRow("subscribers", { id: s.id })} className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-4">
                  <img src="/images/seedwel-logo.svg" alt="Seedwel logo" className="w-12 h-12 object-contain hidden sm:block" />
                  <div>
                    <h2 className="text-2xl font-black text-white">True Database Console — Firestore + Backup</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Engine: <code className="text-amber-400 font-mono">{dbInfo?.engine || "firestore"}</code> • Firebase: <code className="text-amber-400 font-mono">{dbInfo?.firebaseProject || "seedwel-cbeb8"}</code> • Tuition FREE • Cert ${CERTIFICATE_FEE}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href="/api-docs" className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-all">
                    API Explorer <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={loadDb} className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-300">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {dbInfo?.tables.map((t) => (
                  <button key={t.name} onClick={() => loadTable(t.name)} className={cn("flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-mono transition-all border", openTable === t.name ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-gray-950/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700")}>
                    <Table2 className="w-3.5 h-3.5" /> {t.name} <span className="rounded-full bg-gray-800 px-1.5 py-0.5 text-[10px] font-black text-white">{t.count}</span>
                  </button>
                ))}
                {!dbInfo && <div className="flex items-center gap-2 text-gray-500 text-sm py-4"><Loader2 className="w-4 h-4 animate-spin" /> Reading database…</div>}
              </div>
            </div>
            {openTable && (
              <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 font-mono">
                  {openTable} <span className="text-amber-400">({tableRows.length} rows)</span> • Firestore true DB
                </h3>
                {tableLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-6">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading rows…
                  </div>
                ) : tableRows.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">Table empty — seed Firestore via Users tab.</p>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {tableRows.map((row, i) => (
                      <div key={i} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 flex items-start gap-3">
                        <pre className="flex-1 min-w-0 text-[11px] text-gray-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(row, null, 1).slice(0, 1200)}
                          {JSON.stringify(row).length > 1200 ? " …" : ""}
                        </pre>
                        <button onClick={() => handleDeleteRow(openTable, row)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 p-1.5 text-rose-300 shrink-0">
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

        {activeTab === "advisor" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> Management Advisory — Certificate Incorporation Model
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    What to Upgrade • <span className="text-amber-400">Tuition FREE, Cert ${CERTIFICATE_FEE} Paid</span>
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {["All", "School Building", "AI & Developers", "Investor Deal Flow", "Curriculum", "Technical", "Payment"].map((cat) => (
                    <button key={cat} onClick={() => setRecFilter(cat)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-all", recFilter === cat ? "bg-amber-500 text-gray-950 font-bold" : "bg-gray-800/80 text-gray-400 hover:text-white")}>
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
                            <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">{r.actionType}</span>
                            <span className={cn("rounded-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider", r.priority === "High" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : r.priority === "Strategic" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-sky-500/20 text-sky-300 border border-sky-500/40")}>
                              Priority: {r.priority}
                            </span>
                            <span className="text-xs font-semibold text-gray-400">• {r.category}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{r.title}</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{r.description}</p>
                          <div className="rounded-xl bg-gray-900/90 border border-gray-800 p-3 text-xs text-amber-400 font-medium">
                            <span className="text-gray-400 font-semibold">Expected Impact: </span>{r.impact}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => toggleRecStatus(r.id)} className={cn("inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all", status === "Completed" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300" : status === "In Progress" ? "bg-sky-500/20 border border-sky-500/40 text-sky-300" : "bg-gray-800 hover:bg-gray-700 text-gray-300")}>
                            {status === "Completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}{status === "In Progress" && <Clock className="w-3.5 h-3.5 text-sky-400" />}{status === "Recommended" && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />} Status: {status}
                          </button>
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

      {editor && (
        <div className="fixed inset-0 z-[70] bg-gray-950/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditor(null)}>
          <div className="w-full max-w-3xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div>
                <h3 className="font-black text-white">{editor.mode === "new" ? `New ${RESOURCE_META[resource].label.slice(0, -1)}` : `Edit ${RESOURCE_META[resource].label.slice(0, -1)}`}</h3>
                <p className="text-[11px] text-gray-500">Firestore true DB • Edit JSON record</p>
              </div>
              <button onClick={() => setEditor(null)} className="rounded-lg bg-gray-800 hover:bg-gray-700 p-2 text-gray-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <textarea value={editor.text} onChange={(e) => setEditor({ ...editor, text: e.target.value })} spellCheck={false} className="w-full h-[50vh] rounded-2xl bg-gray-950 border border-gray-800 p-4 text-xs text-emerald-300 font-mono focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed" />
              {editorError && <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{editorError}</div>}
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={() => setEditor(null)} className="rounded-xl bg-gray-800 hover:bg-gray-700 px-4 py-2.5 text-xs font-bold text-gray-300">Cancel</button>
                <button onClick={saveRecord} disabled={savingRecord} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-5 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-60">
                  {savingRecord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {savingRecord ? "Saving…" : "Save to Firestore True DB"}
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
