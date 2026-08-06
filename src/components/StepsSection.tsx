import { Brain, Search, Layers, TrendingUp, Users, Rocket } from "lucide-react";
import { stepsToWealth } from "../data/content";

const iconMap: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-7 h-7" />,
  Search: <Search className="w-7 h-7" />,
  Layers: <Layers className="w-7 h-7" />,
  TrendingUp: <TrendingUp className="w-7 h-7" />,
  Users: <Users className="w-7 h-7" />,
  Rocket: <Rocket className="w-7 h-7" />,
};

export default function StepsSection() {
  return (
    <section id="steps" className="py-24 bg-gray-950 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">
            The Roadmap
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 mb-5">
            6 Steps to Becoming a{" "}
            <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Billionaire
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Every self-made billionaire followed a variation of these fundamental steps. 
            The path is clear — the question is whether you'll walk it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepsToWealth.map((step) => (
            <div
              key={step.number}
              className="group relative bg-gray-900/60 border border-gray-800 rounded-2xl p-7 hover:border-amber-500/40 transition-all duration-500 hover:bg-gray-900/80 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
            >
              {/* Step number */}
              <div className="absolute -top-4 -right-2 text-7xl font-black text-gray-800/50 group-hover:text-amber-500/10 transition-colors duration-500 select-none">
                {step.number}
              </div>

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {iconMap[step.icon]}
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
