import { niches } from "../data/content";
import NicheCard from "./NicheCard";

export default function NichesSection() {
  return (
    <section id="niches" className="py-24 bg-gray-950 relative">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/3 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
            The Opportunities
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            High-Paying Niches That Create{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Billionaires
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            These six industries have minted the most self-made billionaires in the past decade. 
            Each includes real examples, earnings data, and actionable strategies.
          </p>
        </div>

        {/* Niche Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {niches.map((niche) => (
            <a
              key={niche.id}
              href={`#${niche.id}`}
              className="bg-gray-800/60 border border-gray-700/50 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-400 transition-all"
            >
              {niche.title}
            </a>
          ))}
        </div>

        <div className="space-y-10">
          {niches.map((niche, index) => (
            <NicheCard key={niche.id} niche={niche} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
