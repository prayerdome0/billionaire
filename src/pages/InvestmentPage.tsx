import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Handshake,
  Lightbulb,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";

export default function InvestmentPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Investment Opportunities"
        title="Help Us Build the Future"
        highlight="of Education"
        description="We are seeking strategic investors and partners who believe in the power of education and skills development."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {/* What investment supports */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Your Investment Supports</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                Long-Term Development Plans
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Building2, title: "Modern Schools", desc: "Physical learning centres and institutions" },
                { icon: Lightbulb, title: "Digital Platforms", desc: "Online learning technology" },
                { icon: Target, title: "Training Programs", desc: "Professional skills development" },
                { icon: TrendingUp, title: "Technology Infrastructure", desc: "Digital tools and systems" },
                { icon: Users, title: "Skills Initiatives", desc: "Community education programs" },
                { icon: Handshake, title: "Employment Opportunities", desc: "Jobs as the company grows" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex items-start gap-3 hover:border-amber-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{item.title}</div>
                    <div className="text-gray-500 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why invest */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                  Investment in Education is Investment in People
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  We believe that investment in education is an investment in people, communities, and the future. Our approach combines education, technology, skills, employment, and investment to create sustainable opportunities.
                </p>
                <p className="text-gray-500 text-xs">
                  For investors, this represents an opportunity to participate in a growing vision focused on education and human development.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "Registered Company", desc: "Legally registered under PACRA, Zambia" },
                  { icon: TrendingUp, title: "Long-Term Vision", desc: "Building for sustainable growth" },
                  { icon: Users, title: "Community Impact", desc: "Creating real opportunities" },
                  { icon: Target, title: "Strategic Approach", desc: "Education + Technology + Investment" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
                    <item.icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white text-sm">{item.title}</div>
                      <div className="text-gray-500 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Who can invest */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Become Part of the Vision</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                Who We're Looking For
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Investors", desc: "Strategic capital for growth" },
                { title: "Organizations", desc: "Shared mission and vision" },
                { title: "Educators", desc: "Expertise and experience" },
                { title: "Professionals", desc: "Skills and contributions" },
              ].map((item, i) => (
                <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 text-center hover:border-amber-500/30 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-3">Invest in the vision. Build opportunities. Change lives.</h3>
            <p className="text-gray-400 text-sm mb-6">Get in touch to discuss investment and partnership opportunities.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"
              >
                Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/partnerships"
                className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              >
                Partnership Details
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
