import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Eye, History, Loader2, PlayCircle, Signal, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import VideoModal from "../components/VideoModal";
import FeedbackWidget from "../components/FeedbackWidget";
import { fetchVideos, type VideoWithStats } from "../lib/api";
import { getModule, successStories } from "../data/content";
import { getRecentWatches } from "../components/BrandedVideoPlayer";
import { storyToVideo, videoThumbnail } from "../lib/storyVideo";
import { cn } from "../utils/cn";

const SUCCESS_TAB = "success-stories";

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<VideoWithStats | null>(null);
  const [recent] = useState(() => getRecentWatches());

  useEffect(() => {
    let mounted = true;
    fetchVideos()
      .then((v) => mounted && setVideos(v))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  /** Success-story videos (the successful people) merged into the library. */
  const storyVideos = useMemo(() => {
    return successStories.map(storyToVideo).filter((v): v is VideoWithStats => Boolean(v));
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

  const filtered = useMemo<VideoWithStats[]>(() => {
    if (filter === "all") return [...storyVideos, ...videos];
    if (filter === SUCCESS_TAB) return storyVideos;
    return videos.filter((v) => v.moduleId === filter);
  }, [videos, storyVideos, filter]);

  const thumbnail = (v: VideoWithStats) => videoThumbnail(v.youtubeId);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Video Masterclasses • Successful People"
        title="Learn From the"
        highlight="World's Best"
        description="Every module pairs with a curated masterclass — and every successful person on our Wall of Inspiration has a real video of their story. Every video opens with a Seedwel welcome and ends with a thank you."
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
            All Videos ({videos.length + storyVideos.length || "…"})
          </button>
          <button
            onClick={() => setFilter(SUCCESS_TAB)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
              filter === SUCCESS_TAB
                ? "bg-amber-500 text-gray-900 border-amber-500 font-bold"
                : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
            )}
          >
            <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            Successful People ({storyVideos.length})
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
              <Loader2 className="w-5 h-5 animate-spin" /> Loading videos from the API...
            </div>
          ) : (
            <>
              {/* Recently watched strip */}
              {recent.length > 0 && (
                <div className="mb-10 rounded-2xl bg-gray-900/40 border border-gray-800 p-5">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400/70" /> Continue watching
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={`${r.videoId}-${r.watchedAt}`}
                        onClick={() => {
                          const story = r.videoId.startsWith("story-")
                            ? storyVideos.find((v) => v.id === r.videoId)
                            : undefined;
                          const mv = story || videos.find((v) => v.id === r.videoId);
                          if (mv) setActive(mv as VideoWithStats);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-300 transition-all truncate max-w-[260px]"
                      >
                        ▶ {r.videoTitle}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((video) => {
                  const mod = getModule(video.moduleId);
                  const isStory = video.kind === "success-story";
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
                          {isStory ? "Success Story" : video.level}
                        </span>
                        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-white/90 bg-black/50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3" /> {video.duration}
                        </span>
                        {isStory && (
                          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-emerald-300 bg-black/50 px-2 py-1 rounded-md">
                            <Sparkles className="w-3 h-3" /> {video.person}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold mb-1.5">
                          {isStory ? "Successful People" : mod ? `Module ${mod.number}` : "Masterclass"}
                        </p>
                        <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                          {isStory ? `${video.person} — ${video.title}` : video.title}
                        </h3>
                        <p className="text-gray-500 text-xs mt-2 flex items-center gap-1.5">
                          <Signal className="w-3 h-3" /> {video.channel}
                          {typeof video.views === "number" && video.views > 0 && (
                            <span className="flex items-center gap-1 text-emerald-400/80 ml-1">
                              <Eye className="w-3 h-3" /> {video.views.toLocaleString()} views
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-14 rounded-3xl bg-gray-900/40 border border-gray-800 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-white">Enjoying the videos?</h3>
                  <p className="text-gray-500 text-sm mt-1">Your feedback shapes the next masterclass.</p>
                </div>
                <FeedbackWidget page="/videos" />
              </div>
            </>
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
