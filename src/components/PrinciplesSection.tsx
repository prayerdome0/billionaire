import { Clock, Key, Zap, Target, GitBranch, Network } from "lucide-react";
import { wealthPrinciples } from "../data/content";

const iconMap: Record<string, React.ReactNode> = {
  Clock: <Clock className="w-6 h-6" />,
  Key: <Key className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Target: <Target className="w-6 h-6" />,
  GitBranch: <GitBranch className="w-6 h-6" />,
  Network: <Network className="w-6 h-6" />,
};

export default function PrinciplesSection() {
  return (
    <section id="principles" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
            The Foundation
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            Core Wealth{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Principles
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            These timeless principles are shared by virtually every self-made billionaire. 
            Master them before choosing your niche.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wealthPrinciples.map((principle, index) => (
            <div
              key={index}
              className="group bg-gray-950/50 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                {iconMap[principle.icon]}
              </div>
              <h3 className="text-lg font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                {principle.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {principle.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
