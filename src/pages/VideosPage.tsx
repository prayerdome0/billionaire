import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Loader2, PlayCircle, Signal } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import VideoModal from "../components/VideoModal";
import { fetchVideos } from "../lib/api";
import { getModule, type Video } from "../data/content";
import { cn } from "../utils/cn";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Video | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchVideos()
      .then((v) => mounted && setVideos(v))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const modules = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; title: string }[] = [];
    for (const v of videos) {
      const m = getModule(v.moduleId);
      if (m && !seen.has(m.id)) {
        seen.add(m.id);
        out.push({ id: m.id, title: m.title });
      }
    }
    return out;
  }, [videos]);

  const filtered = useMemo(
    () => (filter === "all" ? videos : videos.filter((v) => v.moduleId === filter)),
    [videos, filter]
  );

  const thumbnail = (v: Video) => `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Video Masterclasses"
        title="Learn From the"
        highlight="World's Best"
        description="Every module pairs with a curated masterclass — from Ray Dalio's economic machine to Naval Ravikant's wealth framework. Click any card to watch it right here."
      >
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
              filter === "all"
                ? "bg-amber-500 text-gray-900 border-amber-500 font-bold"
                : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
            )}
          >
            All Masterclasses ({videos.length || "…"})
          </button>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setFilter(m.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                filter === m.id
                  ? "bg-amber-500 text-gray-900 border-amber-500 font-bold"
                  : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
              )}
            >
              {m.title}
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-20">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading masterclasses from the API...
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((video) => {
                const mod = getModule(video.moduleId);
                return (
                  <button
                    key={video.id}
                    onClick={() => setActive(video)}
                    className="group text-left bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={thumbnail(video)}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/30">
                          <PlayCircle className="w-8 h-8 text-gray-900" />
                        </div>
                      </div>
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded bg-black/60 text-amber-300 border border-amber-500/30">
                        {video.level}
                      </span>
                      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 bg-black/50 px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" /> {video.duration}
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold mb-1.5">
                        {mod ? `Module ${mod.number}` : "Masterclass"}
                      </p>
                      <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {video.title}
                      </h3>
                      <p className="text-gray-500 text-xs mt-2 flex items-center gap-1.5">
                        <Signal className="w-3 h-3" /> {video.channel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-16 bg-gradient-to-br from-gray-900 to-gray-900/60 border border-gray-800 rounded-3xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Want the frameworks behind the videos?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-6">
              Each masterclass connects to a full written lesson with quizzes and action steps — read, watch, then execute.
            </p>
            <Link
              to="/lessons"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105"
            >
              Go to the Lessons
            </Link>
          </div>
        </div>
      </section>

      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
      <Footer />
    </div>
  );
}
