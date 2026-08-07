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
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import SuccessStoriesSection from "../components/SuccessStoriesSection";
import VideoPreviewSection from "../components/VideoPreviewSection";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl animate-float pointer-events-none hidden md:block" />
        <div className="absolute top-32 right-10 w-52 h-52 bg-yellow-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none hidden md:block" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white/95 p-3.5 shadow-2xl shadow-amber-500/20 mb-6 border-2 border-amber-500/40 animate-float">
            <img
              src="/images/seedwel-logo.svg"
              alt="Seedwel Investment Limited Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-5 py-2">
            <span className="text-amber-300 text-xs md:text-sm font-bold tracking-wider uppercase">
              SEEDWEL INVESTMENT LIMITED • ZAMBIA
            </span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
          Building Skills. Creating Opportunities.{" "}
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            Investing in the Future.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed">
          We are building a new generation of opportunities through education, technology, professional skills, and strategic investment.
        </p>

        <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-10">
          Our journey begins with digital learning and professional services, with a long-term vision of establishing modern schools and learning centres that create meaningful opportunities for individuals and communities.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/courses"
            className="group bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl text-lg hover:from-amber-400 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105"
          >
            Explore Courses
          </Link>
          <Link
            to="/partnerships"
            className="group flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold px-8 py-4 rounded-xl text-lg hover:bg-emerald-500/30 hover:border-emerald-500/60 transition-all duration-300"
          >
            Partner With Us
          </Link>
          <Link
            to="/investment"
            className="group flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300"
          >
            Investment Opportunities
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">Education</div>
            <div className="text-xs text-gray-500 mt-1">Online & Practical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">Technology</div>
            <div className="text-xs text-gray-500 mt-1">Digital Solutions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">Skills</div>
            <div className="text-xs text-gray-500 mt-1">Professional Training</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">Investment</div>
            <div className="text-xs text-gray-500 mt-1">Strategic Partners</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisionSection() {
  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal direction="left">
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Vision</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
              A future where quality education, practical skills, technology, and employment opportunities are accessible to more people.
            </h2>
            <p className="text-gray-400 leading-relaxed">
              We envision establishing modern educational institutions that combine academic learning with practical digital and professional skills.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: GraduationCap, title: "Education", desc: "Accessible, practical, high-quality" },
              { icon: Lightbulb, title: "Technology", desc: "Digital solutions & platforms" },
              { icon: Briefcase, title: "Employment", desc: "Career opportunities" },
              { icon: TrendingUp, title: "Investment", desc: "Sustainable growth" },
            ].map((item, i) => (
              <Reveal key={i} direction="up" delay={i * 90}>
                <div className="bg-gray-950/60 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-amber-400" />
                  </div>
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

function MissionSection() {
  const missions = [
    "Develop accessible and practical online courses",
    "Equip learners with skills that can be applied in the workplace",
    "Create opportunities for talented individuals to grow professionally",
    "Develop digital and technology-based solutions",
    "Build partnerships with organizations, businesses, and investors",
    "Establish schools and learning centres in the future",
    "Create employment opportunities as the company expands",
    "Support young people and professionals in developing valuable skills",
  ];

  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <Reveal className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Mission</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
            What Drives Us{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Forward</span>
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {missions.map((m, i) => (
            <Reveal key={i} direction="up" delay={(i % 4) * 80}>
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all hover:-translate-y-1">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 font-black text-sm">
                  {i + 1}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{m}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesPreview() {
  const services = [
    { icon: BookOpen, title: "Online Courses", desc: "Practical professional & digital skills", to: "/courses" },
    { icon: Building2, title: "School Development", desc: "Long-term learning centres", to: "/about" },
    { icon: TrendingUp, title: "Investment", desc: "Strategic opportunities", to: "/investment" },
    { icon: Handshake, title: "Partnerships", desc: "Collaborate with us", to: "/partnerships" },
  ];

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        <Reveal className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">What We Do</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
            Our{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Services</span>
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <Reveal key={i} direction="up" delay={(i % 4) * 80}>
              <Link
                to={s.to}
                className="group bg-gray-950/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">{s.title}</h3>
                <p className="text-gray-400 text-sm">{s.desc}</p>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:gap-3 transition-all"
          >
            View All Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-5">
            Learn. Invest. Partner.{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Build the Future.</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10">
            Whether you are a learner, investor, organization, educator, or strategic partner — we welcome opportunities to work together.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "For Learners", desc: "Start developing practical skills", to: "/courses", icon: GraduationCap },
            { label: "For Investors", desc: "Help build tomorrow's infrastructure", to: "/investment", icon: TrendingUp },
            { label: "For Partners", desc: "Develop new opportunities together", to: "/partnerships", icon: Handshake },
            { label: "For Professionals", desc: "Join our growing network", to: "/careers", icon: Users },
          ].map((item, i) => (
            <Reveal key={i} direction="up" delay={(i % 4) * 80}>
              <Link
                to={item.to}
                className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">{item.label}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
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
      <VisionSection />
      <MissionSection />
      <ServicesPreview />
      <VideoPreviewSection />
      <SuccessStoriesSection limit={6} />
      <CTASection />
      <Footer />
    </div>
  );
}
