import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Dices, Globe2, Quote, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { QuoteMarquee, default as SuccessStoriesSection } from "../components/SuccessStoriesSection";
import { successStories } from "../data/content";

function DailyBoost() {
  const [current, setCurrent] = useState(() => successStories[Math.floor(Math.random() * successStories.length)]);
  const [spin, setSpin] = useState(0);

  const roll = () => {
    let next = current;
    while (next.id === current.id && successStories.length > 1) {
      next = successStories[Math.floor(Math.random() * successStories.length)];
    }
    setCurrent(next);
    setSpin((s) => s + 1);
  };

  return (
    <div className="mt-20 rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 p-8 md:p-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-bounce-soft">
          <Dices className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Daily Motivation Boost
          </span>
          <div key={spin} className="animate-fade-in">
            <h3 className="text-xl md:text-2xl font-black text-white mt-2">“{current.quote}”</h3>
            <p className="text-amber-300 font-bold text-sm mt-2">— {current.name}, {current.country}</p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3 max-w-3xl">{current.encouragement}</p>
          </div>
        </div>
        <button
          onClick={roll}
          className="group inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-6 py-3 text-sm font-bold text-amber-300 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Give Me Another Boost
        </button>
      </div>
    </div>
  );
}

export default function SuccessStoriesPage() {
  const continents = new Set(successStories.map((s) => s.country.split(" / ")[0]));
  const stats = [
    { value: String(successStories.length), label: "Success Icons" },
    { value: String(continents.size), label: "Countries & Continents" },
    { value: "$1T+", label: "Combined Net Worth" },
    { value: "100%", label: "Started From Nothing" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Success Stories • Wall of Inspiration"
        title="More Successful People,"
        highlight="More Encouragement"
        description="Photos, quotes and words of motivation from the world's most successful founders, investors and change-makers — including Africa's own Aliko Dangote, Strive Masiyiwa, Tony Elumelu and Mo Abudu. If they could rise from where they started, so can you."
      />

      <QuoteMarquee slow />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Stats */}
          <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 text-center hover:border-amber-500/40 transition-all">
                <div className="text-3xl md:text-4xl font-black text-amber-400">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </Reveal>

          <Reveal className="flex items-center gap-3 mb-8">
            <Quote className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl md:text-3xl font-black text-white">
              Their Words, <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Your Fuel</span>
            </h2>
          </Reveal>

          {/* Full grid — reuses the section component without its header/marquee/CTA */}
          <SuccessStoriesSection showHeader={false} showMarquee={false} showCta={false} />

          <DailyBoost />

          {/* CTA */}
          <Reveal className="mt-20 text-center">
            <h2 className="text-2xl md:text-4xl font-black text-white mb-4">
              Inspiration is free.{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                The skills to act on it are free too.
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm md:text-base">
              Every success story above started with learning. Our full Billionaire Blueprint curriculum — 28 lessons, quizzes,
              videos and progress tracking — is 100% free. No hidden fees. Ever.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/courses"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                Start Learning Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/videos"
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold px-8 py-4 rounded-xl hover:bg-amber-500/20 transition-all"
              >
                <TrendingUp className="w-4 h-4" /> Watch the Masterclasses
              </Link>
              <span className="inline-flex items-center gap-2 text-gray-500 text-sm">
                <Globe2 className="w-4 h-4 text-amber-400/70" /> Tuition FREE worldwide • Certificate $5
              </span>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </div>
  );
}
