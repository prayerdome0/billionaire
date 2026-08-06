import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
  Quote,
  Star,
  Users,
  TerminalSquare,
} from "lucide-react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import StepsSection from "../components/StepsSection";
import PrinciplesSection from "../components/PrinciplesSection";
import NichesSection from "../components/NichesSection";
import ComparisonSection from "../components/ComparisonSection";
import GallerySection from "../components/GallerySection";
import DownloadSection from "../components/DownloadSection";
import Footer from "../components/Footer";
import { founders, lessons, testimonials, videos } from "../data/content";

function ExploreSection() {
  const cards = [
    {
      to: "/lessons",
      icon: BookOpen,
      title: "28 In-Depth Lessons",
      desc: "A complete curriculum across 6 modules — mindset, money mechanics, business, investing, niches, and execution. Each lesson ends with quizzes and action steps.",
      accent: "from-amber-500 to-yellow-600",
      stat: `${lessons.length} lessons · 6 modules · 84 quiz questions`,
    },
    {
      to: "/videos",
      icon: PlayCircle,
      title: "Video Masterclasses",
      desc: "Watch the same frameworks taught by the world's best — Ray Dalio, Naval Ravikant, Simon Sinek, and more — with course commentary on every video.",
      accent: "from-sky-500 to-blue-600",
      stat: `${videos.length} curated masterclasses · playable in-page`,
    },
    {
      to: "/founders",
      icon: Users,
      title: "Meet the Founders",
      desc: "The four mentors behind the Blueprint — their stories, their playbooks, and direct contact for mentorship questions.",
      accent: "from-rose-500 to-red-600",
      stat: `${founders.length} founders · real bios · contact form`,
    },
    {
      to: "/api-docs",
      icon: TerminalSquare,
      title: "Live REST API + Database",
      desc: "Everything on this site runs through a SQLite-backed REST API. Explore the endpoints, inspect the database, and see the data flow in real time.",
      accent: "from-emerald-500 to-teal-600",
      stat: "15 endpoints · SQLite database · live queries",
    },
  ];

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Beyond the Guide</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            A Full Learning{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Platform
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            The Blueprint is no longer a single page — it's a complete platform with lessons, videos, mentors, and an open API.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group relative bg-gray-950/60 border border-gray-800 rounded-2xl p-8 hover:border-amber-500/40 transition-all duration-500 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br ${card.accent} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-gray-950 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <card.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">{card.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">{card.stat}</span>
                <span className="flex items-center gap-2 text-amber-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialStrip() {
  return (
    <section className="py-24 bg-gray-950 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Student Results</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            What Our{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Students Say
            </span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-8 hover:border-amber-500/30 transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-amber-500/20 mb-4" />
              <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div>
                <div className="text-white font-semibold text-sm">{t.name}</div>
                <div className="text-gray-500 text-xs">{t.role}</div>
              </div>
            </div>
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
      <ExploreSection />
      <StepsSection />
      <PrinciplesSection />
      <NichesSection />
      <ComparisonSection />
      <GallerySection />
      <TestimonialStrip />
      <DownloadSection />
      <Footer />
    </div>
  );
}
