import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Loader2, PlayCircle, Signal } from "lucide-react";
import Reveal from "./Reveal";
import VideoModal from "./VideoModal";
import { fetchVideos } from "../lib/api";
import { getModule, type Video } from "../data/content";

/**
 * Home page preview of the video masterclass library — fetches the live list
 * (Firestore → API → bundled) and shows a rotating featured selection.
 */
export default function VideoPreviewSection() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
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

  const featured = videos.slice(0, 3);

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Video Masterclasses</span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-3">
              Watch, Then{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Execute</span>
            </h2>
            <p className="text-gray-400 mt-3 max-w-xl text-sm md:text-base">
              {videos.length > 0 ? `${videos.length} curated masterclasses` : "Curated masterclasses"} from the world's
              greatest minds — Ray Dalio, Warren Buffett, Steve Jobs, Strive Masiyiwa, Oprah and more.
            </p>
          </div>
          <Link
            to="/videos"
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shrink-0"
          >
            All Masterclasses
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-16">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading masterclasses...
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((video, i) => {
              const mod = getModule(video.moduleId);
              return (
                <Reveal key={video.id} direction="up" delay={i * 100}>
                  <button
                    onClick={() => setActive(video)}
                    className="group w-full text-left bg-gray-950/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/30">
                          <PlayCircle className="w-8 h-8 text-gray-900" />
                        </div>
                      </div>
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
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {active && <VideoModal video={active} onClose={() => setActive(null)} />}
    </section>
  );
}
