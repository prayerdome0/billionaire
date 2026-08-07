import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Building2,
  GraduationCap,
  Handshake,
  Lightbulb,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Partnerships"
        title="Work With Us to Develop"
        highlight="New Opportunities"
        description="Whether you are an investor, organization, educator, technology professional, or strategic partner, we welcome opportunities to work together."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* Why partner */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Why Partner With Us?</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                Building for the Long Term
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto mt-3">
                Our approach combines education, technology, skills, employment, and investment to create sustainable opportunities.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: GraduationCap, title: "Education", desc: "Accessible, practical, high-quality learning" },
                { icon: Lightbulb, title: "Technology", desc: "Digital solutions and innovation" },
                { icon: Award, title: "Skills", desc: "Professional development & training" },
                { icon: Building2, title: "Employment", desc: "Career opportunities as we grow" },
                { icon: TrendingUp, title: "Investment", desc: "Sustainable financial returns" },
                { icon: Users, title: "Communities", desc: "Lasting local impact" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                Who Can Partner With Us
              </h2>
              <p className="text-gray-400 text-sm max-w-xl mx-auto">
                We believe these areas can work together to create sustainable opportunities for individuals and communities.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "For Investors", desc: "Participate in a growing vision focused on education and human development", icon: TrendingUp },
                { title: "For Learners", desc: "Access to practical skills and professional development", icon: GraduationCap },
                { title: "For Professionals", desc: "Opportunities to contribute expertise and skills", icon: Award },
                { title: "For Communities", desc: "Future schools, training centres, and employment opportunities", icon: Users },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Partnership areas */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Partnership Areas</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                How We Can Work Together
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { title: "Educational Partnerships", desc: "Collaborate on curriculum development, training programs, and learning initiatives." },
                { title: "Technology Partnerships", desc: "Develop digital solutions, platforms, and technology infrastructure together." },
                { title: "Investment Partnerships", desc: "Strategic capital to support growth, infrastructure, and program development." },
                { title: "Community Partnerships", desc: "Work together to bring education and skills to communities that need them." },
                { title: "Corporate Partnerships", desc: "Provide training, upskilling, and professional development for organizations." },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 flex items-start gap-4 hover:border-amber-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-3">Be Part of the Journey</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
              We are at the beginning of our journey, and we are looking for people and organizations who believe in what we are building.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"
              >
                Get in Touch <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/investment"
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              >
                Investment Details
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
