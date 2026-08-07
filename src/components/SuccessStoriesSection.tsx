import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Flame, Globe2, Quote, Sparkles, TrendingUp } from "lucide-react";
import Reveal from "./Reveal";
import { successStories, type SuccessStory } from "../data/content";
import { cn } from "../utils/cn";

/** Infinite scrolling quote ticker — pure CSS marquee (see index.css). */
export function QuoteMarquee({ slow = false }: { slow?: boolean }) {
  const doubled = [...successStories, ...successStories];
  return (
    <div className="marquee-mask overflow-hidden py-2 select-none">
      <div className={cn("flex w-max gap-4 animate-marquee", slow && "animate-marquee-slow")}>
        {doubled.map((s, i) => (
          <div
            key={`${s.id}-${i}`}
            className="flex items-center gap-3 rounded-full border border-amber-500/20 bg-gray-900/70 px-5 py-2.5 whitespace-nowrap"
          >
            <Quote className="w-3.5 h-3.5 text-amber-400/70 shrink-0" />
            <span className="text-xs md:text-sm text-gray-300 italic">“{s.quote}”</span>
            <span className="text-[11px] font-bold text-amber-400 whitespace-nowrap">— {s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryCard({ story, index }: { story: SuccessStory; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Reveal direction="up" delay={(index % 3) * 90}>
      <article
        className="group h-full bg-gray-900/60 border border-gray-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/10"
        onMouseEnter={() => setFlipped(true)}
        onMouseLeave={() => setFlipped(false)}
      >
        {/* Photo */}
        <div className="relative h-64 md:h-72 overflow-hidden">
          <img
            src={story.photo}
            alt={`${story.name} — ${story.title}`}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 border border-amber-500/30 px-3 py-1 text-[10px] font-bold text-amber-300">
            <Globe2 className="w-3 h-3" /> {story.country}
          </span>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-300">
            {story.netWorth}
          </span>
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="text-xl font-black text-white">{story.name}</h3>
            <p className="text-amber-400 text-xs font-medium leading-snug mt-0.5">{story.title}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          <blockquote className="border-l-2 border-amber-500 bg-amber-500/5 rounded-r-xl px-4 py-3 mb-4">
            <Quote className="w-3.5 h-3.5 text-amber-500/60 mb-1" />
            <p className="text-gray-300 text-sm italic leading-relaxed">“{story.quote}”</p>
          </blockquote>

          {/* Encouragement — always visible, slightly muted until hover */}
          <p
            className={cn(
              "text-gray-400 text-xs leading-relaxed transition-all duration-500",
              flipped ? "opacity-100" : "opacity-75"
            )}
          >
            <span className="flex items-center gap-1.5 font-bold text-amber-300/90 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Words of encouragement
            </span>
            {story.encouragement}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-4">
            <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full bg-gray-800/90 text-gray-300">
              <TrendingUp className="w-3 h-3 text-amber-400" /> {story.category}
            </span>
            {story.tags.map((t) => (
              <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-800/60 text-gray-500">
                #{t.replace(/\s+/g, "")}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-gray-600 mt-3 font-mono">{story.yearsActive}</p>
        </div>
      </article>
    </Reveal>
  );
}

interface SuccessStoriesSectionProps {
  /** Show only the first N stories on the home page (full list lives at /inspiration). */
  limit?: number;
  showHeader?: boolean;
  showMarquee?: boolean;
  showCta?: boolean;
}

export default function SuccessStoriesSection({
  limit,
  showHeader = true,
  showMarquee = true,
  showCta = true,
}: SuccessStoriesSectionProps) {
  const stories = limit ? successStories.slice(0, limit) : successStories;

  return (
    <section className={showMarquee ? "py-24 bg-gray-950 relative overflow-hidden" : "relative overflow-hidden"}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

      {/* Quote ticker */}
      {showMarquee && <QuoteMarquee />}

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {showHeader && (
          <Reveal className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold tracking-widest uppercase">
              <Flame className="w-4 h-4" /> Wall of Inspiration
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mt-3 mb-5">
              Successful People,{" "}
              <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent animate-gradient">
                Encouraging Words
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Every one of these icons started exactly where you are — with an idea, a dream, and more no's than yes's.
              Read how they pushed through, then go build your own story.
            </p>
          </Reveal>
        )}

        {/* Photo grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, i) => (
            <StoryCard key={story.id} story={story} index={i} />
          ))}
        </div>

        {showCta && (
          <Reveal className="text-center mt-12">
            {limit && limit < successStories.length ? (
              <Link
                to="/inspiration"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                Meet All {successStories.length} Success Icons
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
              >
                <Award className="w-5 h-5" /> Start Your Own Success Story — Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
