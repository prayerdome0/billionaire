import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  User,
} from "lucide-react";
import type { Niche } from "../data/content";

interface Props {
  niche: Niche;
  index: number;
}

export default function NicheCard({ niche, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      id={niche.id}
      className="group bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all duration-500"
    >
      {/* Image Header */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={niche.image}
          alt={niche.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-sm text-gray-900 font-bold text-xs px-3 py-1.5 rounded-full">
          NICHE #{index + 1}
        </div>

        {/* Earnings Badge */}
        <div className="absolute top-4 right-4 bg-gray-950/80 backdrop-blur-sm border border-amber-500/30 text-amber-400 font-bold text-sm px-4 py-2 rounded-full flex items-center gap-1.5">
          <DollarSign className="w-4 h-4" />
          {niche.potentialEarnings}
        </div>

        <div className="absolute bottom-4 left-6 right-6">
          <h3 className="text-3xl font-black text-white">{niche.title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <p className="text-gray-300 leading-relaxed mb-6">{niche.description}</p>

        {/* Why High Paying */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5 mb-6">
          <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Why This Niche Pays So Well
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">{niche.whyHighPaying}</p>
        </div>

        {/* Strategies */}
        <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-amber-400" />
          Key Strategies
        </h4>
        <div className="grid gap-2 mb-6">
          {niche.strategies.map((strategy, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-gray-800/40 rounded-lg px-4 py-3"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-gray-300 text-sm">{strategy}</span>
            </div>
          ))}
        </div>

        {/* Toggle Examples */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl px-5 py-4 text-amber-400 font-semibold hover:bg-amber-500/15 transition-colors group/btn"
        >
          <span className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {expanded ? "Hide" : "Show"} Billionaire Examples ({niche.examples.length})
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 group-hover/btn:animate-bounce" />
          ) : (
            <ChevronDown className="w-5 h-5 group-hover/btn:animate-bounce" />
          )}
        </button>

        {/* Examples */}
        {expanded && (
          <div className="mt-6 space-y-5 animate-fade-in">
            {niche.examples.map((example, i) => (
              <div
                key={i}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h5 className="text-white font-bold text-lg">{example.name}</h5>
                    <span className="text-gray-500 text-sm">{example.company}</span>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold text-sm px-4 py-1.5 rounded-full">
                    {example.netWorth}
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{example.story}</p>
              </div>
            ))}
          </div>
        )}

        {/* Getting Started */}
        {expanded && (
          <div className="mt-6 bg-gray-800/30 border border-gray-700/30 rounded-xl p-6 animate-fade-in">
            <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              🚀 How to Get Started
            </h4>
            <ol className="space-y-3">
              {niche.gettingStarted.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300 text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
