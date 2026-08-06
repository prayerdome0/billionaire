import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
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
  ArrowRight,
  PlusCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  adminLogin,
  fetchAdminOverview,
  fetchAdminRecommendations,
  postInvestorInquiry,
  type AdminOverview,
  type UpgradeRecommendation,
  type InvestorInquiry,
} from "../lib/api";
import { cn } from "../utils/cn";

export default function AdminPage() {
  const [auth, setAuth] = useState<{
    token: string;
    admin: { name: string; role: string; email: string };
  } | null>(() => {
    const saved = localStorage.getItem("seed_admin_auth");
    return saved ? JSON.parse(saved) : null;
  });

  const [email, setEmail] = useState("seed@admin");
  const [password, setPassword] = useState("122023");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "recommendations" | "investors" | "messages" | "system">("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [recommendations, setRecommendations] = useState<UpgradeRecommendation[]>([]);
  const [recFilter, setRecFilter] = useState<string>("All");
  const [recStatusMap, setRecStatusMap] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);

  const [addingTestInquiry, setAddingTestInquiry] = useState(false);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [ov, recs] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminRecommendations(),
      ]);
      setOverview(ov);
      if (recs && recs.recommendations) {
        setRecommendations(recs.recommendations);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (auth) {
      loadDashboardData();
    }
  }, [auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await adminLogin(email, password);
      if (res.success) {
        const authData = { token: res.token, admin: res.admin };
        setAuth(authData);
        localStorage.setItem("seed_admin_auth", JSON.stringify(authData));
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Invalid credentials. Use seed@admin and password 122023.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("seed_admin_auth");
    setAuth(null);
  };

  const addSampleInquiry = async () => {
    setAddingTestInquiry(true);
    try {
      await postInvestorInquiry({
        name: "SADC Growth Fund (Lusaka Office)",
        email: "investments@sadc-growth.org",
        phone: "+260 97 1234567",
        interestArea: "School Building & Educational Infrastructure (Zambia)",
        amountRange: "$100,000 - $500,000",
        message: "We are interested in co-investing in the STEM and AI-ready schools planned by Country Director Zacheus Simbaya in Zambia.",
      });
      await loadDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingTestInquiry(false);
    }
  };

  const toggleRecStatus = (id: string) => {
    setRecStatusMap((prev) => {
      const cur = prev[id] || "Recommended";
      const next = cur === "Recommended" ? "In Progress" : cur === "In Progress" ? "Completed" : "Recommended";
      return { ...prev, [id]: next };
    });
  };

  const filteredRecs = recommendations.filter((r) => {
    if (recFilter === "All") return true;
    if (recFilter === "School Building" && r.category.includes("School")) return true;
    if (recFilter === "AI & Developers" && r.category.includes("AI")) return true;
    if (recFilter === "Investor Deal Flow" && r.category.includes("Investor")) return true;
    if (recFilter === "Curriculum" && r.category.includes("Curriculum")) return true;
    if (recFilter === "Technical" && r.category.includes("Technical")) return true;
    return false;
  });

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md w-full mx-auto px-4 py-20">
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/95 p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0 border border-amber-500/30">
                <img
                  src="/images/seedwel-logo.svg"
                  alt="Seedwel Investment Limited Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Seedwel Admin Portal</h1>
                <p className="text-xs text-amber-400 font-semibold">Seedwel Investment Limited</p>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Log in to manage company registration data, investor inquiries for school building & AI businesses, and view AI system upgrade recommendations.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seed@admin"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="122023"
                    className="w-full bg-gray-950/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>
              </div>

              {loginError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
              >
                <Lock className="w-4 h-4" />
                {loginLoading ? "Authenticating..." : "Sign In to Management Hub"}
              </button>
            </form>

            <div className="mt-6 border-t border-gray-800/80 pt-4 text-center">
              <p className="text-xs text-gray-500">
                Default Credentials: <code className="text-amber-400 font-mono">seed@admin</code> • Password:{" "}
                <code className="text-amber-400 font-mono">122023</code>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Admin Top Header Bar */}
      <div className="border-b border-gray-800/80 bg-gray-900/60 pt-20 pb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/95 p-1.5 flex items-center justify-center shadow-lg shadow-amber-500/15 shrink-0 border border-amber-500/30">
                <img
                  src="/images/seedwel-logo.svg"
                  alt="Seedwel Investment Limited Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-white">Seedwel Executive Admin</h1>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    Registered 2025 • Active
                  </span>
                </div>
                <p className="text-sm text-amber-400 font-medium mt-0.5">
                  {auth.admin.name} • <span className="text-gray-400">{auth.admin.role}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboardData}
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

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 border-t border-gray-800/60 pt-4">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === "overview"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Management Overview
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === "recommendations"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              What to Upgrade or Add (AI Advisor)
            </button>
            <button
              onClick={() => setActiveTab("investors")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === "investors"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Investor Inquiries
              {overview && (
                <span className="ml-1 rounded-full bg-amber-500 text-gray-950 px-1.5 py-0.2 text-[10px] font-black">
                  {overview.investorInquiries.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === "messages"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Messages & Subscribers
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all",
                activeTab === "system"
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              Database & API Health
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Company Summary Card */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                    Official Corporate Profile
                  </span>
                  <h2 className="text-3xl font-black text-white mt-1">Seedwel Investment Limited</h2>
                  <p className="text-gray-400 text-sm mt-2 max-w-2xl">
                    Officially registered last year (2025). We operate an institutional-grade investment platform open for investors in educational infrastructure (school building), artificial intelligence solutions & developers, and strategic wealth curriculum.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Founder & CEO</div>
                    <div className="text-sm font-bold text-white mt-0.5">Mr. Seedwell Khayalethu Masuku</div>
                    <div className="text-[11px] text-amber-400">seed@admin</div>
                  </div>
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-3.5">
                    <div className="text-xs text-gray-500">Country Director</div>
                    <div className="text-sm font-bold text-white mt-0.5">Zacheus Simbaya</div>
                    <div className="text-[11px] text-amber-400">Zambia Regional HQ</div>
                  </div>
                </div>
              </div>

              {/* 3 Pillars Summary */}
              <div className="grid md:grid-cols-3 gap-4 mt-6 border-t border-gray-800/80 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">School Building</div>
                    <div className="text-[11px] text-gray-400">15 STEM & AI Schools in Zambia</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AI Business & Developers</div>
                    <div className="text-[11px] text-gray-400">SaaS Incubator & Developer Academy</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Wealth Curriculum</div>
                    <div className="text-[11px] text-gray-400">28 Lessons & 7 Masterclasses</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Platform & Database Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  ["Total Founders", overview?.stats.founders ?? 6, Users, "amber"],
                  ["Curriculum Lessons", overview?.stats.lessons ?? 28, Award, "amber"],
                  ["Investor Inquiries", overview?.investorInquiries.length ?? 0, Briefcase, "emerald"],
                  ["Contact Messages", overview?.messages.length ?? 0, MessageSquare, "sky"],
                ].map(([label, val, Icon, color], idx) => (
                  <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between text-gray-400 text-xs font-semibold">
                      <span>{label as string}</span>
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-white mt-2">{val as number}</div>
                    <div className="text-xs text-gray-500 mt-1">Live from storage engine</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links / CTAs */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Strategic Roadmap Advisory</h3>
                  <button
                    onClick={() => setActiveTab("recommendations")}
                    className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    View All Recommendations <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  AI-driven analysis of what Seedwel Investment Limited should upgrade or add across school building, AI developer incubators, and investor deal flow.
                </p>
                <div className="space-y-3">
                  {recommendations.slice(0, 2).map((r) => (
                    <div key={r.id} className="rounded-xl bg-gray-950/80 border border-gray-800/80 p-3.5 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            {r.actionType}
                          </span>
                          <span className="text-xs font-bold text-white">{r.title}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-1">{r.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Investor Inquiries</h3>
                  <button
                    onClick={() => setActiveTab("investors")}
                    className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    View All Deal Flow <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {overview?.investorInquiries && overview.investorInquiries.length > 0 ? (
                  <div className="space-y-3">
                    {overview.investorInquiries.slice(0, 2).map((inq) => (
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
                  <div className="text-center py-6 border border-dashed border-gray-800 rounded-2xl">
                    <p className="text-gray-500 text-xs mb-3">No investor inquiries submitted yet</p>
                    <button
                      onClick={addSampleInquiry}
                      disabled={addingTestInquiry}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Sample Investor Inquiry
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHAT TO UPGRADE OR ADD (THE AI MANAGEMENT ADVISOR) */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> AI Management Advisory Engine
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    What to Upgrade or Add to <span className="text-amber-400">Seedwel Investment Limited</span>
                  </h2>
                  <p className="text-gray-400 text-sm mt-1 max-w-2xl">
                    Tailored recommendations for Mr. Seedwell Khayalethu Masuku and Zacheus Simbaya to scale school building projects, AI software developer incubators, and investor deal flow.
                  </p>
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {["All", "School Building", "AI & Developers", "Investor Deal Flow", "Curriculum", "Technical"].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setRecFilter(cat)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                          recFilter === cat
                            ? "bg-amber-500 text-gray-950 font-bold"
                            : "bg-gray-800/80 text-gray-400 hover:text-white"
                        )}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Recommendations list */}
              <div className="mt-8 space-y-4">
                {filteredRecs.map((r) => {
                  const status = recStatusMap[r.id] || "Recommended";
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl bg-gray-950/80 border border-gray-800/80 hover:border-amber-500/40 p-6 transition-all"
                    >
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

                        {/* Interactive Status toggle */}
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

        {/* TAB 3: INVESTOR INQUIRIES */}
        {activeTab === "investors" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white">
                    Investor Deal Flow & Inquiries <span className="text-amber-400 font-mono">({overview?.investorInquiries.length ?? 0})</span>
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Manage prospective investors interested in school building infrastructure and AI developer business solutions.
                  </p>
                </div>

                <button
                  onClick={addSampleInquiry}
                  disabled={addingTestInquiry}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-4 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  {addingTestInquiry ? "Adding Inquiry..." : "Add Sample Investor Deal Flow"}
                </button>
              </div>

              {overview?.investorInquiries && overview.investorInquiries.length > 0 ? (
                <div className="space-y-4">
                  {overview.investorInquiries.map((inq) => (
                    <div key={inq.id} className="rounded-2xl bg-gray-950/80 border border-gray-800 p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{inq.name}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>Email: <a href={`mailto:${inq.email}`} className="text-amber-400 underline">{inq.email}</a></span>
                            {inq.phone && <span>• Phone: <span className="text-white">{inq.phone}</span></span>}
                            <span>• Received: {new Date(inq.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                          {inq.amount_range || "$25,000 - $100,000"}
                        </span>
                      </div>

                      <div className="rounded-xl bg-gray-900/80 border border-gray-800/80 px-4 py-3 text-xs text-gray-300">
                        <span className="text-amber-400 font-semibold">Interest Area: </span>
                        {inq.interest_area}
                      </div>

                      {inq.message && (
                        <p className="text-gray-300 text-sm mt-3 leading-relaxed bg-gray-900/40 rounded-xl p-3">
                          "{inq.message}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl">
                  <Briefcase className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 font-semibold mb-1">No Investor Inquiries Submitted Yet</p>
                  <p className="text-gray-500 text-xs mb-4">
                    Investors can submit their interest via the form on the Founders page or Home page.
                  </p>
                  <button
                    onClick={addSampleInquiry}
                    disabled={addingTestInquiry}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Test Investor Inquiry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MESSAGES & SUBSCRIBERS */}
        {activeTab === "messages" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Contact Messages <span className="text-amber-400 font-mono">({overview?.messages.length ?? 0})</span>
              </h2>
              {overview?.messages && overview.messages.length > 0 ? (
                <div className="space-y-3">
                  {overview.messages.map((m) => (
                    <div key={m.id} className="rounded-xl bg-gray-950/80 border border-gray-800 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{m.name}</span>
                        <span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-amber-400 mt-0.5">{m.subject} • {m.email}</div>
                      <p className="text-gray-300 text-xs mt-2">{m.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No contact messages stored in database yet.</p>
              )}
            </div>

            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <h2 className="text-xl font-bold text-white mb-4">
                Newsletter Subscribers <span className="text-amber-400 font-mono">({overview?.subscribers.length ?? 0})</span>
              </h2>
              {overview?.subscribers && overview.subscribers.length > 0 ? (
                <div className="space-y-2">
                  {overview.subscribers.map((sub) => (
                    <div key={sub.id} className="rounded-xl bg-gray-950/80 border border-gray-800 px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-mono text-white">{sub.email}</span>
                      <span className="text-[11px] text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No newsletter subscribers yet.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM HEALTH */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-gray-900/60 border border-gray-800 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white">Database & API Architecture</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Storage engine inspection and live REST API endpoints.
                  </p>
                </div>
                <Link
                  to="/api-docs"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition-all"
                >
                  Open Live API Explorer <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {overview?.database && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Storage Engine</div>
                    <div className="text-lg font-black text-amber-400 font-mono">{overview.database.engine || "sqlite"}</div>
                    <div className="text-xs text-gray-400 mt-1">{overview.database.file || "data/billionaire.db"}</div>
                  </div>

                  <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Table Counts</div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {overview.database.tables &&
                        Object.entries(overview.database.tables).map(([table, cnt]) => (
                          <div key={table} className="text-xs flex items-center justify-between border-b border-gray-900 py-1">
                            <span className="text-gray-400 font-mono">{table}:</span>
                            <span className="text-white font-bold">{cnt as number}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
