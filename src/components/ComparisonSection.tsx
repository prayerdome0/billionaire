import { niches } from "../data/content";
import { TrendingUp } from "lucide-react";

export default function ComparisonSection() {
  const sortedNiches = [...niches].sort((a, b) => {
    const getMax = (s: string) => {
      const match = s.match(/\$(\d+(?:\.\d+)?)(K|M|B)/g);
      if (!match) return 0;
      const last = match[match.length - 1];
      const num = parseFloat(last.replace("$", ""));
      if (last.includes("B")) return num * 1000000000;
      if (last.includes("M")) return num * 1000000;
      if (last.includes("K")) return num * 1000;
      return num;
    };
    return getMax(b.potentialEarnings) - getMax(a.potentialEarnings);
  });

  return (
    <section className="py-24 bg-gray-950 relative">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
            At a Glance
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            Niche{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Comparison
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Compare earning potential, top examples, and key metrics across all six high-paying niches.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 bg-gray-800/50 rounded-t-xl p-4 border border-gray-700/50">
              <div className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                Niche
              </div>
              <div className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                Potential Earnings
              </div>
              <div className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                Top Example
              </div>
              <div className="text-amber-400 font-bold text-sm uppercase tracking-wider">
                Key Strategy
              </div>
            </div>

            {/* Rows */}
            {sortedNiches.map((niche, i) => (
              <div
                key={niche.id}
                className={`grid grid-cols-4 gap-4 p-4 border-x border-b border-gray-700/50 hover:bg-amber-500/5 transition-colors ${
                  i === sortedNiches.length - 1 ? "rounded-b-xl" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={niche.image}
                      alt={niche.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {niche.title}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-amber-400 font-bold text-sm flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {niche.potentialEarnings}
                  </span>
                </div>
                <div className="flex items-center">
                  <div>
                    <div className="text-white text-sm font-medium">
                      {niche.examples[0].name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {niche.examples[0].netWorth}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm">
                    {niche.strategies[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
