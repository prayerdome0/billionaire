import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Play, RotateCcw, SkipForward, Sparkles, X } from "lucide-react";
import { postVideoView, postWatchHistory, type VideoWithStats } from "../lib/api";
import { speak, stopSpeaking, warmUpVoices } from "../lib/speech";
import { site } from "../data/content";
import { cn } from "../utils/cn";

type Phase = "intro" | "video" | "outro";

/* ---------------- YouTube IFrame API loader (loaded once) ---------------- */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}
let ytApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (typeof window !== "undefined" && window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

/** localStorage key used to remember recently watched videos for guests. */
const RECENT_KEY = "seedwel:recently-watched";

export function addRecentWatch(id: string, title: string) {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    list.unshift({ videoId: id, videoTitle: title, watchedAt: new Date().toISOString() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* noop */
  }
}

export function getRecentWatches(): { videoId: string; videoTitle: string; watchedAt: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

interface BrandedVideoPlayerProps {
  video: VideoWithStats;
  /** Suggested next videos (from the related API). */
  related?: VideoWithStats[];
  onClose: () => void;
}

/**
 * The Seedwel branded player. EVERY video — masterclass or success story —
 * opens with "Welcome to Seedwel Investment Limited, here is …" and closes
 * with "Thank you for watching", spoken via premium voiceover clips when
 * available and browser speech synthesis otherwise.
 */
export default function BrandedVideoPlayer({ video, related = [], onClose }: BrandedVideoPlayerProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [introPlaying, setIntroPlaying] = useState(false);
  const [current, setCurrent] = useState(video);
  const [currentRelated, setCurrentRelated] = useState(related);
  const [outroSpeaking, setOutroSpeaking] = useState(false);
  const [ytError, setYtError] = useState(false);
  const playerRef = useRef<any>(null);
  const iframeWrapRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;

  const welcome = site.videoIntroTemplate || "Welcome to Seedwel Investment Limited, here is";
  const outroText = site.videoOutro || "Thank you for watching. Please like, share and subscribe to Seedwel Investment Limited for more inspiring videos.";

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const stopAudio = () => {
    try {
      audioRef.current?.pause();
      audioRef.current = null;
    } catch {
      /* noop */
    }
    stopSpeaking();
  };

  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  /* -------- intro ---------- */

  const speakIntro = (onEnd: () => void) => {
    // Spoken line stays short and snappy — the full title is on screen.
    const personLine = current.person || current.title;
    const line = `${welcome} ${personLine}.`;
    const clip = current.introAudio;
    if (clip) {
      const audio = new Audio(clip);
      audioRef.current = audio;
      audio.play().then(() => {
        audio.onended = onEnd;
      }).catch(() => {
        audio.onended = null;
        speak(line, { onEnd, interrupt: true });
      });
    } else {
      speak(line, { onEnd, interrupt: true });
    }
  };

  const beginIntro = () => {
    setIntroPlaying(true);
    const startedAt = Date.now();
    const finish = () => {
      const elapsed = Date.now() - startedAt;
      const rest = Math.max(0, 4200 - elapsed);
      later(goToVideo, rest);
    };
    speakIntro(finish);
    // Safety net — never trap the user on the intro.
    later(goToVideo, 12000);
  };

  const skipIntro = () => {
    stopAudio();
    clearTimers();
    goToVideo();
  };

  /* -------- video ---------- */

  const goToVideo = useCallback(() => {
    stopAudio();
    clearTimers();
    setYtError(false);
    setPhase("video");
    // Fire-and-forget analytics: view count + watch history.
    // (Story videos already carry the `story-<id>` API id.)
    const vidId = current.id;
    postVideoView(vidId).catch(() => {});
    postWatchHistory(vidId, current.title).catch(() => {});
    addRecentWatch(vidId, current.title);
  }, [current]);

  const mountPlayer = useCallback(async () => {
    if (phaseRef.current !== "video") return;
    try {
      await loadYouTubeApi();
      if (phaseRef.current !== "video" || !iframeWrapRef.current) return;
      const id = current.youtubeId;
      playerRef.current?.destroy?.();
      playerRef.current = new window.YT.Player(iframeWrapRef.current, {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: {
          onStateChange: (e: any) => {
            // YT.PlayerState.ENDED === 0
            if (e?.data === 0) endVideo();
          },
          onError: () => setYtError(true),
        },
      });
    } catch {
      setYtError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.youtubeId, phase]);

  useEffect(() => {
    warmUpVoices();
    if (phase === "video") mountPlayer();
    return () => {
      clearTimers();
      stopAudio();
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, [phase, mountPlayer]);

  /* -------- outro ---------- */

  const endVideo = useCallback(() => {
    if (phaseRef.current !== "video") return;
    setPhase("outro");
    setOutroSpeaking(true);
    const clip = current.outroAudio;
    if (clip) {
      const audio = new Audio(clip);
      audioRef.current = audio;
      audio.play().then(() => {
        audio.onended = () => setOutroSpeaking(false);
      }).catch(() => {
        audio.onended = null;
        speak(outroText, { onEnd: () => setOutroSpeaking(false), interrupt: true });
      });
    } else {
      speak(outroText, { onEnd: () => setOutroSpeaking(false), interrupt: true });
    }
  }, [current, outroText]);

  const replay = () => {
    stopAudio();
    setPhase("video");
    setYtError(false);
  };

  const playNext = () => {
    const next = currentRelated[0];
    if (!next) return;
    stopAudio();
    setCurrentRelated((prev) => prev.slice(1));
    setCurrent(next);
    setPhase("intro");
    setIntroPlaying(false);
  };

  /* -------- keyboard + close ---------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ================= render ================= */

  const personName = current.person || current.title;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/60">
          <div className="min-w-0 flex items-center gap-3">
            <img src="/images/seedwel-logo.svg" alt="Seedwel" className="w-7 h-7 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Seedwel Investment Limited</p>
              <p className="text-white font-semibold text-sm truncate">{current.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Close video"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video bg-black">
          {/* ---------------- INTRO ---------------- */}
          {phase === "intro" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-amber-950/40">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

              <div className="relative flex flex-col items-center animate-fade-in">
                <div className="relative mb-5">
                  <div className="absolute inset-0 rounded-full border border-amber-500/40 animate-ping-slow" />
                  <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-20 h-20 object-contain rounded-2xl bg-white p-2 shadow-2xl shadow-amber-500/30 animate-float" />
                </div>

                <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-amber-400 font-black mb-2 animate-fade-in">
                  <Sparkles className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Seedwel Investment Limited
                </p>
                <h3 className="text-xl md:text-3xl font-black text-white leading-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent animate-gradient">
                    Seedwel Investment Limited
                  </span>
                </h3>
                <p className="text-sm md:text-lg text-gray-300 mt-3 max-w-xl leading-relaxed">
                  Here is <span className="text-amber-300 font-bold">{personName}</span>
                  {current.person && current.title !== personName && (
                    <>
                      {" "}
                      <span className="text-gray-400">— {current.title}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="relative mt-8 flex flex-col items-center gap-3">
                {!introPlaying ? (
                  <button
                    onClick={beginIntro}
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black px-8 py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/30"
                  >
                    <Play className="w-5 h-5 fill-current" /> Play Video
                  </button>
                ) : (
                  <div className="flex items-center gap-3 w-full max-w-xs">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full animate-intro-bar" />
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Intro</span>
                  </div>
                )}
                <button
                  onClick={skipIntro}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-300 transition-colors"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Skip intro
                </button>
              </div>
            </div>
          )}

          {/* ---------------- VIDEO ---------------- */}
          {phase === "video" && (
            <div className="absolute inset-0 z-[5]">
              {ytError ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-950 text-center px-6">
                  <p className="text-gray-300 font-semibold">This video could not be played here.</p>
                  <a
                    href={`https://www.youtube.com/watch?v=${current.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-xl hover:bg-amber-400"
                  >
                    Watch on YouTube <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div ref={iframeWrapRef} className="w-full h-full" />
              )}
            </div>
          )}

          {/* ---------------- OUTRO ---------------- */}
          {phase === "outro" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-gradient-to-br from-amber-950/50 via-gray-950 to-gray-950">
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

              <div className="relative flex flex-col items-center animate-fade-in">
                <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited" className="w-16 h-16 object-contain rounded-2xl bg-white p-2 shadow-2xl shadow-amber-500/30 mb-5 animate-float" />
                <p className="text-[10px] uppercase tracking-[0.35em] text-amber-400 font-black mb-3">Seedwel Investment Limited</p>
                <h3 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Thank You{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent animate-gradient">
                    for Watching
                  </span>
                </h3>
                <p className="text-sm text-gray-400 mt-3 max-w-md">
                  Please like, share and subscribe to Seedwel Investment Limited for more inspiring videos.
                </p>
                {outroSpeaking && <p className="text-[10px] text-gray-600 mt-2 italic">🔊 {outroText}</p>}
              </div>

              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={replay}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
                >
                  <RotateCcw className="w-4 h-4" /> Watch Again
                </button>
                {currentRelated.length > 0 && (
                  <button
                    onClick={playNext}
                    className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold px-6 py-3 rounded-xl hover:bg-amber-500/20 transition-all"
                  >
                    Up Next: {currentRelated[0].title.length > 28 ? currentRelated[0].title.slice(0, 28) + "…" : currentRelated[0].title}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium",
                    "border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
                  )}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer meta */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 border-t border-gray-800 bg-gray-900/40">
          <span className="text-gray-400 font-semibold">
            {current.person ? `${current.person} • ${current.title}` : current.title}
          </span>
          <span>{current.channel}</span>
          <span>{current.duration}</span>
          <span className="ml-auto flex items-center gap-1.5 text-amber-400/80">
            <Sparkles className="w-3 h-3" /> Every Seedwel video starts &amp; ends with a branded welcome
          </span>
        </div>
      </div>
    </div>
  );
}
