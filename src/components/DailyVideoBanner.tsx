import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Play, Quote, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import BrandedVideoPlayer from "./BrandedVideoPlayer";
import { fetchQuoteOfTheDay, type QuoteOfDay, type VideoWithStats } from "../lib/api";

/**
 * "Video of the Day" banner — pulls the quote of the day from GET /api/quote
 * (a successful person + their video) and plays it in the branded player.
 */
export default function DailyVideoBanner() {
  const [quote, setQuote] = useState<QuoteOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<VideoWithStats | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchQuoteOfTheDay()
      .then((q) => mounted && setQuote(q))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 py-10">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading today's motivation...
      </div>
    );
  }
  if (!quote || !quote.video) return null;

  const play = () => {
    setPlaying({
      id: quote.video!.id,
      kind: "success-story",
      person: quote.author,
      title: quote.video!.title,
      channel: quote.video!.channel,
      description: `${quote.author} — ${quote.title}. ${quote.encouragement}`,
      youtubeId: quote.video!.youtubeId,
      moduleId: "success-stories",
      duration: quote.video!.duration,
      level: "Inspiration",
      tags: [],
      introAudio: null,
      outroAudio: null,
    });
  };

  return (
    <Reveal direction="up">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 p-8 md:p-10">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          {quote.photo && (
            <img
              src={quote.photo}
              alt={quote.author}
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover object-top border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20 shrink-0"
              loading="lazy"
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
              <CalendarDays className="w-4 h-4" /> Video of the Day • {quote.date}
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white mt-3 leading-snug">“{quote.quote}”</h3>
            <p className="text-amber-300 font-bold text-sm mt-2">
              — {quote.author}, {quote.country}
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3 max-w-2xl">{quote.encouragement}</p>
          </div>
          <button
            onClick={play}
            className="group shrink-0 inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black px-7 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
          >
            <span className="w-9 h-9 rounded-full bg-gray-900/15 flex items-center justify-center">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </span>
            Watch {quote.author.split(" ")[0]}'s Story
          </button>
        </div>
        <div className="relative z-10 mt-6 flex items-center gap-2 text-[11px] text-gray-500">
          <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
          <Quote className="w-3.5 h-3.5 text-amber-400/70" />
          Every video opens with “Welcome to Seedwel Investment Limited, here is {quote.author}…” and ends with
          “Thank you for watching.”
        </div>
      </div>
      {playing && <BrandedVideoPlayer video={playing} onClose={() => setPlaying(null)} />}
    </Reveal>
  );
}
