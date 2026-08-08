import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Handshake,
  Lightbulb,
  TrendingUp,
  Users,
  Flame,
  Bot,
  Calendar,
  Play,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import DailyVideoBanner from "../components/DailyVideoBanner";
import SuccessStoriesSection from "../components/SuccessStoriesSection";
import VideoPreviewSection from "../components/VideoPreviewSection";
import InvestmentGallery from "../components/InvestmentGallery";
import SuccessTimeline from "../components/SuccessTimeline";
import { AIFeaturesShowcase, AIAssistantWidget } from "../components/AIAssistant";
import { FilmGrain, FilmReelTicker, ParticleField, CinematicReveal, SpotlightCard } from "../components/Cinematic";
import { challenges365 } from "../data/challenge365";
import { investmentPhotos } from "../data/investmentVisuals";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <ParticleField count={90} />
        <FilmGrain />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/90 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-amber-500/6 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-float pointer-events-none hidden md:block" />
        <div className="absolute top-32 right-10 w-52 h-52 bg-yellow-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none hidden md:block" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white/95 p-3.5 shadow-2xl shadow-amber-500/20 mb-6 border-2 border-amber-500/40 animate-float animate-pulse-glow">
            <img src="/images/seedwel-logo.svg" alt="Seedwel Investment Limited Logo" className="w-full h-full object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-300 text-xs md:text-sm font-bold tracking-wider uppercase">SEEDWEL INVESTMENT LIMITED • ZAMBIA • MOVIE MODE ON 🎬</span>
          </div>
        </div>

        <CinematicReveal>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[0.9] tracking-tight">
            <span className="block">Building Skills. Creating</span>
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent block">Opportunities.</span>
            <span className="block text-3xl md:text-5xl mt-2">Investing in the Future — Like a Movie</span>
          </h1>
        </CinematicReveal>

        <Reveal>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            365-day Journey to Success, cinematic animations, free AI mentors with no API key, real investment photos from Zambian schools & AI labs, and full histories of billionaires who started like you.
          </p>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-10">Tuition FREE • Certificate $5 • Ken Burns photos • Particle fields • Lens flares • Spotlight cards • Film grain</p>
        </Reveal>

        <Reveal className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/journey" className="group bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-black px-8 py-4 rounded-xl text-lg hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 flex items-center gap-2">
            <Flame className="w-5 h-5" /> Start 365-Day Journey
          </Link>
          <Link to="/investment" className="group flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300">
            <Building2 className="w-5 h-5" /> Investment Photos
          </Link>
          <Link to="/inspiration" className="group flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-500/30 transition-all duration-300">
            <Play className="w-5 h-5" /> Movie Histories
          </Link>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[{ v: `${investmentPhotos.length}+`, l: "Investment Photos" }, { v: "6", l: "Billionaire Histories" }, { v: "365", l: "Challenge Days" }, { v: "Free", l: "AI API • No Key" }].map((s) => (
            <div key={s.l} className="text-center rounded-2xl bg-gray-900/40 border border-gray-800 p-4 backdrop-blur-sm">
              <div className="text-2xl md:text-3xl font-black text-amber-400">{s.v}</div>
              <div className="text-xs text-gray-500 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneyTeaser() {
  const today = challenges365[0];
  return (
    <section className="py-20 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <Reveal direction="left">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-[0.3em] uppercase"><Calendar className="w-4 h-4" /> New • 365-Day Journey to Success Challenge</span>
            <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[0.9] text-white">Just Like a Movie — <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">4 Acts, 365 Days.</span></h2>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">Act 1 Starter (1-30): identity, cash flow truth, first $100. Act 2 Builder (31-90): 30-day validation, 10 sales. Act 3 Warrior (91-180): scale, hire, automate. Act 4 Billionaire (181-365): 3 engines, legacy. Each day 15-90 mins, points, streak, real video from successful person, AI coach.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[{ k: "Day 1-30", v: "Starter 15min" }, { k: "Day 31-90", v: "Builder 30min" }, { k: "Day 91-365", v: "Warrior 60-90min" }].map(b => (
                <div key={b.k} className="rounded-xl bg-gray-950 border border-gray-800 p-3 text-center"><div className="text-[10px] text-gray-500 uppercase tracking-wider">{b.k}</div><div className="text-xs font-bold text-white mt-1">{b.v}</div></div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <Link to="/journey" className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black px-6 py-3 text-sm hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center gap-2"><Flame className="w-4 h-4" /> Enter Challenge</Link>
              <a href="/api/challenge/365" target="_blank" className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-3 text-sm font-bold text-gray-300 hover:border-amber-500/30 transition-colors">Free API JSON</a>
            </div>
          </Reveal>
          <Reveal direction="right">
            <SpotlightCard className="rounded-[28px] bg-gray-950/60 border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">{today.category} • Day {today.day}</span>
                <span className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Today</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight">{today.title}</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-2">{today.description}</p>
              <div className="mt-4 space-y-2">
                {today.actions.slice(0, 2).map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300"><span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">{i + 1}</span><span>{a}</span></div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-black/50 border border-gray-800 p-3">
                <div className="text-[11px] italic text-gray-300">"{today.quote}"</div>
                <div className="text-[10px] font-bold text-amber-300 mt-1">— {today.quoteAuthor}</div>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal direction="left">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Vision • Movie Mode</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5 leading-tight">A future where quality education, practical skills, technology, and employment are cinematic and accessible.</h2>
            <p className="text-gray-400 leading-relaxed">We now have real investment photos, movie-like animations, full billionaire timelines, 365-day challenge with streaks and points, free AI API with 5 mentor personas — no key needed, and spotlight cards that follow your mouse like in a film.</p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {[{ icon: GraduationCap, title: "Education", desc: "Practical + movie lessons" }, { icon: Bot, title: "Free AI", desc: "No key, no limit" }, { icon: Calendar, title: "365 Challenge", desc: "Daily + streaks" }, { icon: TrendingUp, title: "Investment", desc: "Real photos, real yields" }].map((item, i) => (
              <Reveal key={i} direction="up" delay={i * 90}>
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3"><item.icon className="w-5 h-5 text-amber-400" /></div>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesPreview() {
  const services = [
    { icon: BookOpen, title: "Online Courses", desc: "Practical professional & digital skills", to: "/courses" },
    { icon: Calendar, title: "365 Challenge", desc: "Journey to success daily", to: "/journey" },
    { icon: Bot, title: "Free AI API", desc: "Mentors, ideas, wealth plan", to: "/api-docs" },
    { icon: Building2, title: "Investment Photos", desc: "Real Zambia sites", to: "/investment" },
  ];
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <Reveal className="text-center mb-14">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">What We Do • New Features</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">Our <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Services</span> — Movie Edition</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <Reveal key={i} direction="up" delay={(i % 4) * 80}>
              <Link to={s.to} className="group bg-gray-950/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><s.icon className="w-6 h-6 text-amber-400" /></div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <HeroSection />
      <FilmReelTicker items={["🎬 Movie Animations — Ken Burns, Particle Field, Lens Flare, Spotlight", "📸 Real Investment Photos — Zambia Schools & AI Labs", "📜 Billionaire Histories — Timeline + Struggles + Net Worth Journey", "🔥 365-Day Challenge — Points, Streak, Rewards, AI Coach", "🤖 Free AI API — No Key, 5 Mentors, Wealth Plan, Idea Engine", "Tuition FREE • Certificate $5 • Film Grain • Spotlight Cards"]} />
      <JourneyTeaser />
      <VisionSection />
      <ServicesPreview />
      <InvestmentGallery limit={6} />
      <AIFeaturesShowcase />
      <VideoPreviewSection />
      <section className="py-10 bg-gray-950 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4"><DailyVideoBanner /></div>
      </section>
      <SuccessStoriesSection limit={3} />
      <section className="pb-10 bg-gray-900"><div className="max-w-6xl mx-auto px-4 text-center"><Link to="/inspiration" className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:gap-3 transition-all">View full movie timelines <ArrowRight className="w-4 h-4" /></Link></div></section>
      <Footer />
      <AIAssistantWidget />
    </div>
  );
}
