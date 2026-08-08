import { Link } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle, Handshake, Lightbulb, ShieldCheck, Target, TrendingUp, Users, Camera, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import InvestmentGallery from "../components/InvestmentGallery";
import Reveal from "../components/Reveal";
import { AIAssistantWidget } from "../components/AIAssistant";

export default function InvestmentPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Investment Opportunities • Real Photos • Movie Animations"
        title="Help Us Build the Future"
        highlight="of Education"
        description="New: real investment photos from Zambia schools, AI labs, solar microgrids, student housing — all with Ken Burns cinematic animation, spotlight hover, and lens flare. Plus investor lessons from billionaire histories."
      />

      {/* gallery */}
      <InvestmentGallery />

      <section className="pb-24 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-[0.3em] uppercase"><Camera className="w-4 h-4" /> How We Use Investment Photos</span>
            <h2 className="text-3xl font-black text-white mt-3">Every Photo is a <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Business Unit</span></h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto mt-3 leading-relaxed">These aren't stock fillers. Each category is a Seedwel profit center: school building = tuition + land, AI = SaaS MRR + talent pipeline, solar = energy savings as profit, agri = yield, real estate = rent.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {[
              { icon: Building2, title: "Modern Schools", desc: "800+ students per campus • Solar + fiber • Jobs" },
              { icon: Lightbulb, title: "AI Business", desc: "50+ developers • 12 products • Global clients" },
              { icon: Target, title: "Solar Microgrid", desc: "150kW • 400kWh storage • 99.9% uptime" },
              { icon: TrendingUp, title: "Real Estate Yield", desc: "16% target • Triple-net leases • 96% occupancy" },
              { icon: Users, title: "Tech Hub", desc: "35+ startups • $2M+ funding • Demo days" },
              { icon: Handshake, title: "Agriculture AI", desc: "5k hectares • 32% yield up • 400 farmers" },
            ].map((item, i) => (
              <Reveal key={i} direction="up" delay={i * 60}>
                <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-5 flex items-start gap-3 hover:border-amber-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0"><item.icon className="w-5 h-5 text-amber-400" /></div>
                  <div><div className="font-semibold text-white text-sm">{item.title}</div><div className="text-gray-500 text-xs leading-snug mt-1">{item.desc}</div></div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300"><Sparkles className="w-3 h-3" /> Cinematic Investor Experience</span>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-4 mb-4">Photos that Move Like a Movie, Numbers that Compound Like Buffett</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">We added real movie animations: Ken Burns zoom on photos, particle field behind hero, film grain overlay, lens flare, spotlight cards that follow your mouse, typewriter text, and parallax. Investment should feel premium, not brochure.</p>
                <p className="text-gray-500 text-xs">Open era: $10k school min, $5k AI fund min, all with milestone escrow & quarterly distributions.</p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: ShieldCheck, title: "Registered Company", desc: "PACRA Zambia • 2025 certificate incorporation" },
                  { icon: TrendingUp, title: "Long-Term Vision", desc: "Schools that last 50 years, AI that scales forever" },
                  { icon: Users, title: "Community Impact", desc: "400+ farmers, 800 students per campus, 120 jobs" },
                  { icon: Target, title: "Strategic Pillars", desc: "Education + AI + Real Estate = diversified moat" },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 flex items-start gap-3"><item.icon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /><div><div className="font-semibold text-white text-sm">{item.title}</div><div className="text-gray-500 text-xs">{item.desc}</div></div></div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-3">Invest in the vision. Build opportunities. Change lives.</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/invest" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all text-sm"><Building2 className="w-4 h-4" /> View Open Deals <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/journey" className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 px-6 py-3 rounded-xl text-sm font-bold transition-all">Join 365 Challenge</Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <AIAssistantWidget />
    </div>
  );
}
