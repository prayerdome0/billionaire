import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle,
  GraduationCap,
  Handshake,
  Lightbulb,
  Rocket,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

function CurrentStageSection() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Current Stage</span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
              A New & Growing{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Company</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              We are a new and growing company. At this stage, we are focused on building our foundation, developing our services, creating educational programs, establishing partnerships, and preparing for future expansion.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              We have <strong className="text-white">not yet built our own physical school</strong>, but building schools and learning centres is a major part of our long-term vision.
            </p>
            <p className="text-gray-400 leading-relaxed">
              We welcome investors, organizations, educators, professionals, and strategic partners who are interested in helping us turn this vision into reality.
            </p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-amber-400" /> What We're Building
            </h3>
            <div className="space-y-3">
              {[
                "Digital learning platform",
                "Professional online courses",
                "Strategic partnerships",
                "Community of learners",
                "Future school infrastructure",
                "Employment pathways",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FutureSection() {
  const phases = [
    {
      phase: "Phase 1",
      title: "Build",
      color: "from-amber-400 to-yellow-500",
      items: ["Establish the digital platform", "Develop professional courses", "Build partnerships", "Grow our digital services", "Establish our brand"],
    },
    {
      phase: "Phase 2",
      title: "Expand",
      color: "from-emerald-400 to-teal-500",
      items: ["Increase the number of courses", "Build a larger learner community", "Develop employment opportunities", "Attract strategic investors", "Expand operations"],
    },
    {
      phase: "Phase 3",
      title: "Establish",
      color: "from-sky-400 to-blue-500",
      items: ["Develop physical learning centres", "Establish schools", "Create training facilities", "Expand into additional communities"],
    },
    {
      phase: "Phase 4",
      title: "Grow",
      color: "from-violet-400 to-purple-500",
      items: ["Expand nationally and internationally", "Develop additional educational programs", "Create more employment opportunities", "Establish long-term partnerships"],
    },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Future</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
            From a Vision to a{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Reality</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            We are starting from the foundation. Today, we are building the systems, programs, partnerships, and opportunities that will support tomorrow's larger vision.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((p, i) => (
            <div key={i} className="bg-gray-950/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
              <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${p.color} px-3 py-1 text-xs font-black text-gray-950 mb-4`}>
                {p.phase}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{p.title}</h3>
              <ul className="space-y-2">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyPartnerSection() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Why Partner With Us?</span>
          <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
            Building for the{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Long Term</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { icon: GraduationCap, title: "Education", desc: "Accessible, practical learning" },
            { icon: Lightbulb, title: "Technology", desc: "Digital solutions & innovation" },
            { icon: Award, title: "Skills", desc: "Professional development" },
            { icon: Briefcase, title: "Employment", desc: "Career opportunities" },
            { icon: TrendingUp, title: "Investment", desc: "Sustainable returns" },
            { icon: Users, title: "Communities", desc: "Lasting local impact" },
            { icon: Handshake, title: "Partnerships", desc: "Collaborative growth" },
            { icon: Target, title: "Vision", desc: "Long-term objectives" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 text-center hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-sm">{item.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-gray-400 max-w-2xl mx-auto mb-6">
            We believe these areas can work together to create sustainable opportunities for individuals and communities.
          </p>
          <Link
            to="/partnerships"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
          >
            Explore Partnerships <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="About Us"
        title="Building Opportunities Through"
        highlight="Education & Investment"
        description="We are a newly established and forward-thinking company committed to creating opportunities through education, skills development, technology, and sustainable investment."
      />

      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Vision</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
                To build a future where quality education, practical skills, technology, and employment opportunities are accessible to more people.
              </h2>
              <p className="text-gray-400 leading-relaxed">
                We envision establishing modern educational institutions that combine academic learning with practical digital and professional skills.
              </p>
            </div>
            <div>
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our Mission</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-5">
                Our mission is to create lasting opportunities.
              </h2>
              <div className="space-y-3">
                {[
                  "Develop accessible and practical online courses",
                  "Equip learners with workplace-ready skills",
                  "Create opportunities for talented individuals",
                  "Develop digital and technology-based solutions",
                  "Build partnerships with organizations and investors",
                  "Establish schools and learning centres in the future",
                  "Create employment opportunities as we expand",
                  "Support young people and professionals",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CurrentStageSection />
      <FutureSection />
      <WhyPartnerSection />
      <Footer />
    </div>
  );
}
