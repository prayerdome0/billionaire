import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Briefcase,
  CheckCircle,
  GraduationCap,
  Rocket,
  Target,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Career Opportunities"
        title="Learn Today."
        highlight="Build Your Future."
        description="Our vision goes beyond providing courses. As the company grows and new projects, schools, digital operations, and business opportunities are established, qualified and talented learners may have opportunities to work with us."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Pathway */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  From Learning to Opportunity
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Completing a course does <strong className="text-white">not automatically guarantee employment</strong>. However, successful learners may be considered for future opportunities based on their skills, performance, and professional conduct.
                </p>
                <p className="text-gray-500 text-xs">
                  This creates a pathway where learners can develop skills today and potentially become part of our growing organization in the future.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: GraduationCap, label: "Learn", desc: "Develop skills" },
                  { icon: Target, label: "Excel", desc: "Show performance" },
                  { icon: Award, label: "Certify", desc: "Earn credentials" },
                  { icon: Briefcase, label: "Opportunity", desc: "Grow with us" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-center">
                    <item.icon className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <div className="font-bold text-white text-sm">{item.label}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* What we look for */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">What We Consider</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                How Learners Are Considered for Opportunities
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "Skills", desc: "Relevant abilities and competencies" },
                { title: "Performance", desc: "Quality of work and dedication" },
                { title: "Experience", desc: "Practical and professional background" },
                { title: "Availability", desc: "Readiness to take on roles" },
                { title: "Company Requirements", desc: "Alignment with organizational needs" },
                { title: "Job Openings", desc: "Current available positions" },
                { title: "Professional Conduct", desc: "Work ethic and attitude" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white text-sm">{item.title}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Growth areas */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Growth Areas</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                Where Opportunities May Arise
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Rocket, title: "New Projects", desc: "As the company takes on new initiatives" },
                { icon: Users, title: "Schools", desc: "Future learning centres and institutions" },
                { icon: Briefcase, title: "Digital Operations", desc: "Technology and online services" },
                { icon: Target, title: "Business Opportunities", desc: "Expanding services and markets" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-amber-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-3">Ready to Start Developing Skills?</h3>
            <p className="text-gray-400 text-sm mb-6">Begin your journey today by exploring our courses.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"
              >
                Explore Courses <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
