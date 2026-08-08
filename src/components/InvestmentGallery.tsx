import { useState } from "react";
import { investmentPhotos, categories } from "../data/investmentVisuals";
import Reveal from "./Reveal";
import { CinematicReveal, SpotlightCard, KenBurnsImage, CountUp } from "./Cinematic";
import { MapPin, TrendingUp, X, ArrowRight, Building2, Cpu, Sun, Home, Truck, DollarSign } from "lucide-react";

const iconMap: Record<string, any> = {
  "School Building": Building2,
  "AI Business": Cpu,
  "Solar Energy": Sun,
  "Real Estate": Home,
  "Agriculture": Truck,
  "Tech Hub": Cpu,
  "Finance": DollarSign
};

export default function InvestmentGallery({ limit, showHeader = true }: { limit?: number; showHeader?: boolean }) {
  const [activeCat, setActiveCat] = useState("All");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = investmentPhotos.filter(p => activeCat === "All" || p.category === activeCat);
  const visible = limit ? filtered.slice(0, limit) : filtered;
  const activePhoto = investmentPhotos.find(p => p.id === selected);

  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      {/* ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {showHeader && (
          <div className="text-center mb-14">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-black tracking-[0.3em] uppercase">
                <TrendingUp className="w-4 h-4" /> Investment Visual Stories • Real Photos, Real Sites
              </span>
            </Reveal>
            <CinematicReveal>
              <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[0.9] tracking-tight">
                <span className="text-white">Where Your Money </span>
                <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Builds What Lasts</span>
              </h2>
              <p className="mt-5 text-gray-400 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
                Every photo is a real Seedwel site type — STEM schools in Lusaka, AI labs, solar microgrids, student housing, agri-tech. 
                Cinematic Ken Burns animation just like in a movie. Tap any photo to see the full investment story with stats.
              </p>
            </CinematicReveal>

            {/* categories */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide border transition-all ${activeCat === cat ? "bg-amber-500 text-gray-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105" : "bg-gray-900/60 border-gray-800 text-gray-400 hover:border-amber-500/40 hover:text-white"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* masonry cinematic grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[380px]">
          {visible.map((photo, i) => {
            const Icon = iconMap[photo.category] || Building2;
            return (
              <Reveal key={photo.id} direction="up" delay={(i % 3) * 110}>
                <SpotlightCard className="group h-full rounded-[28px] bg-gray-900/60 border border-gray-800 overflow-hidden hover:border-amber-500/40 hover:-translate-y-2 transition-all duration-700 hover:shadow-2xl hover:shadow-amber-500/10">
                  <button onClick={() => setSelected(photo.id)} className="w-full h-full text-left">
                    {/* Ken Burns image */}
                    <div className="relative h-[60%] overflow-hidden">
                      <KenBurnsImage src={photo.image} alt={photo.title} className="h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/30 to-transparent" />
                      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5">
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">{photo.category}</span>
                      </div>
                      <div className="absolute top-4 right-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-bold text-white/80 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {photo.location}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-black text-white leading-tight group-hover:text-amber-200 transition-colors">{photo.title}</h3>
                      </div>
                    </div>

                    <div className="p-5 h-[40%] flex flex-col">
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{photo.description}</p>
                      <div className="mt-auto grid grid-cols-3 gap-3 pt-4 border-t border-gray-800/80">
                        {photo.stats.map(s => (
                          <div key={s.label} className="text-center">
                            <div className="text-sm font-black text-white"><CountUp target={parseInt(s.value) || 0} suffix={s.value.replace(/[0-9]/g, "")} /></div>
                            <div className="text-[9px] uppercase tracking-wider text-gray-500">{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:gap-2 transition-all">View Investment Story <ArrowRight className="w-3 h-3" /></div>
                    </div>
                  </button>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>

        {/* Lightbox movie modal */}
        {activePhoto && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"><X className="w-5 h-5" /></button>
            <div className="max-w-5xl w-full grid md:grid-cols-2 gap-0 rounded-[24px] overflow-hidden bg-gray-900 border border-gray-800 max-h-[90vh] overflow-y-auto animate-cinematic-zoom">
              <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[360px]">
                <img src={activePhoto.image} alt={activePhoto.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:bg-gradient-to-r" />
                <div className="absolute bottom-0 left-0 p-6 md:hidden">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 text-gray-950 px-3 py-1 text-[10px] font-black uppercase tracking-wider mb-3">{activePhoto.category}</div>
                  <h3 className="text-2xl font-black text-white leading-tight">{activePhoto.title}</h3>
                  <div className="flex items-center gap-1 mt-2 text-white/70 text-xs"><MapPin className="w-3 h-3" /> {activePhoto.location}</div>
                </div>
              </div>
              <div className="p-8 flex flex-col">
                <div className="hidden md:block">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-4">{activePhoto.category} • {activePhoto.location}</div>
                  <h3 className="text-3xl font-black text-white leading-tight">{activePhoto.title}</h3>
                </div>
                <p className="mt-4 text-gray-300 text-sm leading-relaxed">{activePhoto.description}</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {activePhoto.stats.map(s => (
                    <div key={s.label} className="rounded-2xl bg-gray-950/70 border border-gray-800 p-4 text-center">
                      <div className="text-2xl font-black text-amber-400">{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Investor Lesson — Movie Moment 🎬</div>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">"This is not rendering — it's what Seedwel builds in Zambia: physical walls + solar + AI fiber that generate tuition 20 years. Land + learning = forever asset. — Zacheus & Seedwell"</p>
                </div>
                <div className="mt-auto pt-6 flex gap-3">
                  <a href="/invest" className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black text-sm py-3.5 text-center hover:from-amber-400 hover:to-yellow-400 transition-all">Invest in {activePhoto.category}</a>
                  <button onClick={() => setSelected(null)} className="rounded-xl border border-gray-800 bg-gray-950 px-6 py-3.5 text-sm font-bold text-gray-300 hover:border-amber-500/40 transition-colors">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
