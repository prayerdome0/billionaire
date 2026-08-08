import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Dices, Globe2, Play, Quote, RefreshCw, Sparkles, TrendingUp, Film, Award } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import { QuoteMarquee, default as SuccessStoriesSection } from "../components/SuccessStoriesSection";
import BrandedVideoPlayer from "../components/BrandedVideoPlayer";
import FeedbackWidget from "../components/FeedbackWidget";
import SuccessTimeline from "../components/SuccessTimeline";
import InvestmentGallery from "../components/InvestmentGallery";
import { successStories } from "../data/content";
import { storyToVideo, videoThumbnail } from "../lib/storyVideo";
import { AIAssistantWidget } from "../components/AIAssistant";
import type { VideoWithStats } from "../lib/api";

function DailyBoost() {
  const [current, setCurrent] = useState(() => successStories[Math.floor(Math.random() * successStories.length)]);
  const [spin, setSpin] = useState(0);
  const [playing, setPlaying] = useState<VideoWithStats | null>(null);
  const roll = () => {
    let next = current;
    while (next.id === current.id && successStories.length > 1) {
      next = successStories[Math.floor(Math.random() * successStories.length)];
    }
    setCurrent(next);
    setSpin((s) => s + 1);
  };
  const video = storyToVideo(current);
  return (
    <div className="mt-20 rounded-3xl bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 p-8 md:p-12 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-bounce-soft"><Dices className="w-8 h-8" /></div>
        <div className="flex-1 min-w-0">
          <span className="text-amber-400 text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Daily Motivation Boost</span>
          <div key={spin} className="animate-fade-in">
            <h3 className="text-xl md:text-2xl font-black text-white mt-2">“{current.quote}”</h3>
            <p className="text-amber-300 font-bold text-sm mt-2">— {current.name}, {current.country}</p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3 max-w-3xl">{current.encouragement}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          {video && <button onClick={() => setPlaying(video)} className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 text-sm transition-all hover:scale-105 shadow-lg shadow-amber-500/25"><Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> Watch {current.name.split(" ")[0]}'s Video</button>}
          <button onClick={roll} className="group inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-6 py-3 text-sm font-bold text-amber-300 transition-all"><RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> Give Me Another Boost</button>
        </div>
      </div>
      {playing && <BrandedVideoPlayer video={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function StoryVideoLibrary() {
  const [playing, setPlaying] = useState<VideoWithStats | null>(null);
  const withVideo = successStories.filter((s) => storyToVideo(s));
  return (
    <section className="pb-24">
      <div className="max-w-6xl mx-auto px-4">
        <Reveal className="flex items-center gap-3 mb-3"><Play className="w-5 h-5 text-amber-400" /><h2 className="text-2xl md:text-3xl font-black text-white">Watch Their Stories — <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">a video after every photo</span></h2></Reveal>
        <Reveal><p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-3xl">Every successful person now has real video. Each opens with <span className="text-amber-300 font-semibold">“Welcome to Seedwel Investment Limited, here is…”</span> and ends with <span className="text-amber-300 font-semibold">“Thank you for watching.”</span></p></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {withVideo.map((story, i) => {
            const v = storyToVideo(story); if (!v) return null;
            return (
              <Reveal key={story.id} direction="up" delay={(i % 3) * 80}>
                <button onClick={() => setPlaying(v)} className="group text-left w-full bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
                  <div className="relative aspect-video overflow-hidden">
                    <img src={videoThumbnail(v.youtubeId)} alt={`${story.name} — ${v.title}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 rounded-full bg-amber-500/95 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/30"><Play className="w-6 h-6 text-gray-900 fill-current ml-0.5" /></div></div>
                    <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 text-amber-300 border border-amber-500/30"><Clock className="w-3 h-3" /> {v.duration}</span>
                    <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/70 text-emerald-300 border border-emerald-500/30">{story.netWorth}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-widest text-amber-400/80 font-semibold mb-1.5">{story.country} • {story.category}</p>
                    <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">{story.name}</h3>
                    <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{v.title}</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
      {playing && <BrandedVideoPlayer video={playing} onClose={() => setPlaying(null)} />}
    </section>
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
        eyebrow="Success Stories • Movie Histories • Full Timelines"
        title="More Successful People,"
        highlight="More Encouragement"
        description="NEW: Full cinematic histories — early struggles, breakthrough, wealth journey with year-by-year milestones, movie titles like 'The Cement Empire'. Plus investment photos showing what Seedwel actually builds. Plus 365 challenge + free AI."
      />
      <QuoteMarquee slow />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-gray-900/60 border border-gray-800 p-6 text-center hover:border-amber-500/40 transition-all">
                <div className="text-3xl md:text-4xl font-black text-amber-400">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </Reveal>
          <Reveal className="flex items-center gap-3 mb-8"><Quote className="w-5 h-5 text-amber-400" /><h2 className="text-2xl md:text-3xl font-black text-white">Their Words, <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Your Fuel</span></h2></Reveal>
          <SuccessStoriesSection showHeader={false} showMarquee={false} showCta={false} />
          <DailyBoost />
        </div>
      </section>

      {/* NEW — cinematic expanded histories timeline */}
      <SuccessTimeline />

      <StoryVideoLibrary />

      <InvestmentGallery limit={6} showHeader={false} />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal className="rounded-3xl bg-gray-900/40 border border-gray-800 p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div><h3 className="text-lg md:text-xl font-black text-white">Enjoying the movie histories & investment photos?</h3><p className="text-gray-500 text-sm mt-1">Rate this page — it helps Seedwel make better content.</p></div>
              <FeedbackWidget page="/inspiration" />
            </div>
          </Reveal>

          <Reveal className="mt-20 text-center">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-widest uppercase"><Film className="w-4 h-4" /> Movie Edition Complete</span>
            <h2 className="text-2xl md:text-4xl font-black text-white mt-3 mb-4">Inspiration is free. <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">The skills to act on it are free too.</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm md:text-base">Plus NEW: 365-day challenge, free AI API with 5 mentors, cinematic animations, real investment photos. Tuition FREE, always.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/journey" className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105 shadow-lg shadow-amber-500/25"><Award className="w-5 h-5" /> Start 365-Day Journey <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
              <Link to="/investment" className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold px-8 py-4 rounded-xl hover:bg-amber-500/20 transition-all"><TrendingUp className="w-4 h-4" /> View Investment Photos</Link>
              <span className="inline-flex items-center gap-2 text-gray-500 text-sm"><Globe2 className="w-4 h-4 text-amber-400/70" /> Tuition FREE worldwide • Certificate $5</span>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
      <AIAssistantWidget />
    </div>
  );
}
