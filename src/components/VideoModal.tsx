import { useEffect } from "react";
import { X } from "lucide-react";
import type { Video } from "../data/content";
import { getModule } from "../data/content";
import { cn } from "../utils/cn";

export default function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  const module = getModule(video.moduleId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="min-w-0">
            <h3 className="text-white font-bold truncate">{video.title}</h3>
            <p className="text-gray-500 text-xs">
              {video.channel} · {video.duration} ·{" "}
              <span className={cn("font-medium", module ? "text-amber-400/80" : "text-gray-500")}>
                {module ? `Module ${module.number}: ${module.title}` : "Masterclass"}
              </span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="px-5 py-4">
          <p className="text-gray-400 text-sm leading-relaxed">{video.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {video.tags.map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
