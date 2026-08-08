import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, PlayCircle, Search, Sparkles, TerminalSquare, Users, Newspaper, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { founders, lessons, niches, posts, successStories, videos } from "../data/content";

interface Hit {
  type: "lesson" | "video" | "niche" | "founder" | "post" | "success";
  title: string;
  subtitle: string;
  href: string;
  icon: typeof BookOpen;
  meta: string;
}

const icons = {
  lesson: BookOpen,
  video: PlayCircle,
  niche: TerminalSquare,
  founder: Users,
  post: Newspaper,
  success: Sparkles,
} as const;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  useEffect(() => {
    setQ(params.get("q") || "");
  }, [params]);

  const update = (value: string) => {
    setQ(value);
    if (value.trim()) setParams({ q: value }, { replace: true });
    else setParams({}, { replace: true });
  };

  const results = useMemo<Hit[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const hit = (...fields: string[]) => fields.some((f) => f.toLowerCase().includes(needle));

    const out: Hit[] = [];
    for (const l of lessons)
      if (hit(l.title, l.subtitle, l.summary))
        out.push({ type: "lesson", title: l.title, subtitle: l.summary, href: `/lessons/${l.id}`, icon: icons.lesson, meta: `Lesson L${String(l.number).padStart(2, "0")} · ${l.duration}` });
    for (const v of videos)
      if (hit(v.title, v.description, v.channel, ...v.tags))
        out.push({ type: "video", title: v.title, subtitle: v.description, href: "/videos", icon: icons.video, meta: `Video · ${v.channel}` });
    for (const n of niches)
      if (hit(n.title, n.description, ...n.strategies))
        out.push({ type: "niche", title: n.title, subtitle: n.description.slice(0, 140) + "…", href: "/#niches", icon: icons.niche, meta: `Niche · ${n.potentialEarnings}` });
    for (const f of founders)
      if (hit(f.name, f.bio, f.role, ...f.focus))
        out.push({ type: "founder", title: f.name, subtitle: `${f.role} — ${f.bio.slice(0, 130)}…`, href: "/founders", icon: icons.founder, meta: "Founder" });
    for (const p of posts)
      if (hit(p.title, p.excerpt, ...p.tags))
        out.push({ type: "post", title: p.title, subtitle: p.excerpt, href: `/blog/${p.slug}`, icon: icons.post, meta: `Blog · ${p.readTime}` });
    for (const s of successStories)
      if (hit(s.name, s.title, s.quote, s.country, s.video?.title || "", ...(s.tags || [])))
        out.push({ type: "success", title: s.name, subtitle: `${s.title} — “${s.quote}”`, href: "/inspiration", icon: icons.success, meta: `Success Story · ${s.country} · video included` });

    return out.slice(0, 30);
  }, [q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { lesson: 0, video: 0, niche: 0, founder: 0, post: 0 };
    for (const r of results) c[r.type]++;
    return c;
  }, [results]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Search"
        title="Find Anything in the"
        highlight="Blueprint"
        description="Search across all 28 lessons, video masterclasses, high-paying niches, founders, and blog posts."
      >
        <div className="mt-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => update(e.target.value)}
              placeholder="Try 'compounding', 'AI', 'real estate', 'Naval'..."
              className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            {q && (
              <button onClick={() => update("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </PageHeader>

      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4">
          {q.trim() && (
            <p className="text-sm text-gray-500 mb-6">
              <span className="text-amber-400 font-semibold">{results.length}</span> results for "
              <span className="text-white">{q.trim()}</span>"
              {Object.entries(counts).filter(([, n]) => n > 0).map(([type, n]) => (
                <span key={type} className="ml-3 text-xs bg-gray-800/80 px-2 py-1 rounded-full">
                  {n} {type === "success" ? "success stories" : `${type}s`}
                </span>
              ))}
            </p>
          )}

          {!q.trim() ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Type something above to search the platform.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {["compounding", "AI", "real estate", "mindset", "pricing", "leverage", "house hacking"].map((s) => (
                  <button
                    key={s}
                    onClick={() => update(s)}
                    className="text-sm px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No results for "{q}". Try a different term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <Link
                  key={i}
                  to={r.href}
                  className="group flex items-start gap-4 bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <r.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">{r.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">{r.type}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{r.subtitle}</p>
                  </div>
                  <span className="hidden sm:block text-xs text-gray-600 shrink-0">{r.meta}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
