import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle,
  Code2,
  Database,
  GitBranch,
  Loader2,
  Play,
  RefreshCw,
  Server,
  Terminal,
  XCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import {
  API_ENDPOINTS,
  getApiStats,
  type ApiStats,
} from "../lib/api";
import { cn } from "../utils/cn";

const methodColor: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  POST: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  DELETE: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

interface DbSnapshot {
  engine: string;
  file: string;
  tables: Record<string, number>;
  recentMessages: { id: number; name: string; email: string; subject: string; created_at: string }[];
  recentComments: { id: number; lesson_id: string; name: string; text: string; created_at: string }[];
  recentSubscribers: { id: number; email: string; created_at: string }[];
  recentProgress: { client_id: string; lesson_id: string; completed_at: string }[];
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Database }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <span className="text-gray-500 text-xs uppercase tracking-widest font-semibold">{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}

export default function ApiDocsPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [db, setDb] = useState<DbSnapshot | null>(null);
  const [selected, setSelected] = useState(API_ENDPOINTS[0]);
  const [response, setResponse] = useState<{ ok: boolean; status: number; body: string } | null>(null);
  const [trying, setTrying] = useState(false);

  const load = async () => {
    const [s, d] = await Promise.all([
      getApiStats(),
      fetch("/api/database").then((r) => r.json()).catch(() => null),
    ]);
    setStats(s);
    setDb(d);
  };

  useEffect(() => {
    load();
  }, []);

  const tryEndpoint = async (path: string, method: string) => {
    setTrying(true);
    setResponse(null);
    const now = Date.now();
    try {
      const init: RequestInit = { method, headers: { "Content-Type": "application/json" } };
      if (method === "POST" || method === "DELETE") {
        init.body = JSON.stringify({
          clientId: `api-explorer-${now}`,
          lessonId: "l01-psychology-of-wealth",
          name: "API Explorer",
          email: "explorer@example.com",
          subject: "Test from API docs",
          message: "Hello! This message was created by the API explorer.",
        });
      }
      const res = await fetch(path, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      setResponse({ ok: res.ok, status: res.status, body: pretty });
    } catch (err) {
      setResponse({ ok: false, status: 0, body: String(err) });
    } finally {
      setTrying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Developer Portal"
        title="Live REST API +"
        highlight="SQLite Database"
        description="The entire site runs on this API. Every lesson, video, founder, and niche is served from a SQLite database — and your progress and messages are written back into it. Explore it live below."
      >
        <div className="mt-8 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-5 py-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-300 text-sm font-mono">
            {stats ? `API ONLINE · ${stats.lessons} lessons · ${stats.videos} videos · ${stats.database?.contact_messages ?? 0} messages in DB` : "connecting to API..."}
          </span>
        </div>
      </PageHeader>

      {/* Stats */}
      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-4">
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Founders" value={stats.founders} icon={Server} />
              <StatCard label="Modules" value={stats.modules} icon={GitBranch} />
              <StatCard label="Lessons" value={stats.lessons} icon={Code2} />
              <StatCard label="Videos" value={stats.videos} icon={Play} />
              <StatCard label="Blog Posts" value={stats.posts ?? 0} icon={Code2} />
              <StatCard label="Contact Messages" value={stats.contactMessages} icon={Database} />
              <StatCard label="Comments" value={stats.comments ?? 0} icon={CheckCircle} />
              <StatCard label="Lessons Completed" value={stats.completedLessons} icon={CheckCircle} />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-10">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading live stats...
            </div>
          )}
        </div>
      </section>

      {/* API Explorer */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-[380px_1fr] gap-8">
          <div>
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
              <Terminal className="w-6 h-6 text-amber-400" /> Endpoints
            </h2>
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-2">
              {API_ENDPOINTS.map((ep) => (
                <button
                  key={ep.method + ep.path}
                  onClick={() => {
                    setSelected(ep);
                    setResponse(null);
                  }}
                  className={cn(
                    "w-full text-left flex items-start gap-3 bg-gray-900/60 border rounded-xl px-4 py-3 transition-all",
                    selected.path === ep.path && selected.method === ep.method
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-gray-800 hover:border-gray-700"
                  )}
                >
                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded border shrink-0 mt-0.5", methodColor[ep.method])}>
                    {ep.method}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-white text-xs font-mono truncate">{ep.path}</span>
                    <span className="block text-gray-500 text-xs mt-0.5">{ep.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-bold px-3 py-1.5 rounded-lg border", methodColor[selected.method])}>
                    {selected.method}
                  </span>
                  <code className="text-white font-mono text-sm">{selected.path}</code>
                </div>
                <p className="text-gray-500 text-sm mt-2">{selected.description}</p>
              </div>
              <button
                onClick={() => tryEndpoint(selected.path, selected.method)}
                disabled={trying}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
              >
                {trying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {trying ? "Calling..." : "Try it"}
              </button>
            </div>

            {response && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  {response.ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                  <span className={cn("text-sm font-bold", response.ok ? "text-emerald-400" : "text-rose-400")}>
                    HTTP {response.status}
                  </span>
                </div>
                <pre className="bg-gray-950 border border-gray-800 rounded-xl p-5 overflow-x-auto text-xs text-emerald-300 font-mono leading-relaxed max-h-96 overflow-y-auto">
                  {response.body}
                </pre>
              </div>
            )}

            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">cURL example</p>
              <pre className="bg-gray-950 border border-gray-800 rounded-xl p-5 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed">
{`curl -X ${selected.method} http://localhost:3001${selected.path} \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Database inspector */}
      <section className="py-16 bg-gray-900/40 border-y border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-3">
            <Database className="w-6 h-6 text-amber-400" /> Database Inspector
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Live view of <code className="text-amber-500/80">GET /api/database</code> — the actual SQLite tables behind this site.
          </p>

          {db ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                  Engine · {db.engine}
                </p>
                <p className="text-[11px] text-gray-600 font-mono mb-5 truncate">{db.file}</p>
                <div className="space-y-2">
                  {Object.entries(db.tables).map(([table, count]) => (
                    <div key={table} className="flex items-center justify-between bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-2.5">
                      <span className="text-gray-300 text-sm font-mono">{table}</span>
                      <span className="text-amber-400 font-mono text-sm">{count} rows</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                    Latest contact_messages (from the founders form)
                  </p>
                  {db.recentMessages.length === 0 ? (
                    <p className="text-gray-600 text-sm">No messages yet — try the contact form on the Founders page!</p>
                  ) : (
                    <div className="space-y-2">
                      {db.recentMessages.map((m) => (
                        <div key={m.id} className="bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-semibold">{m.name}</span>
                            <span className="text-gray-600 text-xs font-mono">{m.created_at.slice(0, 16).replace("T", " ")}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">{m.email} · {m.subject}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                    Latest comments (from lesson discussions)
                  </p>
                  {db.recentComments.length === 0 ? (
                    <p className="text-gray-600 text-sm">No comments yet — post one on any lesson!</p>
                  ) : (
                    <div className="space-y-2">
                      {db.recentComments.map((c) => (
                        <div key={c.id} className="bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-semibold">{c.name}</span>
                            <span className="text-amber-400/80 text-xs font-mono truncate">{c.lesson_id}</span>
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5 truncate">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                    Latest newsletter subscribers
                  </p>
                  {db.recentSubscribers.length === 0 ? (
                    <p className="text-gray-600 text-sm">No subscribers yet — try the footer signup!</p>
                  ) : (
                    <div className="space-y-2">
                      {db.recentSubscribers.map((s) => (
                        <div key={s.id} className="bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 text-sm font-mono">{s.email}</span>
                            <span className="text-gray-600 text-xs font-mono">{String(s.created_at).slice(0, 10)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                    Latest lesson_progress (from the Lessons page)
                  </p>
                  {db.recentProgress.length === 0 ? (
                    <p className="text-gray-600 text-sm">No progress yet — complete a lesson on the Lessons page!</p>
                  ) : (
                    <div className="space-y-2">
                      {db.recentProgress.map((p, i) => (
                        <div key={i} className="bg-gray-900/80 border border-gray-800/60 rounded-lg px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-400 text-sm font-mono truncate">{p.lesson_id}</span>
                            <span className="text-gray-600 text-xs font-mono">{p.completed_at.slice(0, 16).replace("T", " ")}</span>
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5 font-mono truncate">{p.client_id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-10">
              <Loader2 className="w-5 h-5 animate-spin" /> Reading database...
            </div>
          )}

          <button
            onClick={() => {
              setStats(null);
              setDb(null);
              load();
            }}
            className="mt-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh live data
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
