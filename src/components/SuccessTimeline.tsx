import { expandedHistories } from "../data/successHistories";
import Reveal from "./Reveal";
import { CinematicReveal, SpotlightCard } from "./Cinematic";
import { Clock, DollarSign, TrendingUp, Quote, Play } from "lucide-react";
import { storyToVideo } from "../lib/storyVideo";
import { useState } from "react";
import BrandedVideoPlayer from "./BrandedVideoPlayer";
import type { VideoWithStats } from "../lib/api";

export default function SuccessTimeline() {
  const [playing, setPlaying] = useState<VideoWithStats | null>(null);

  return (
    <section className="py-24 bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.06),transparent_60%)]" />
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <CinematicReveal>
          <div className="text-center mb-16">
            <span className="text-amber-400 text-xs font-black tracking-[0.3em] uppercase">History of Successful People • Cinematic Timeline Like A Movie</span>
            <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[0.9]">
              <span className="text-white">They Started </span>
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Exactly Where You Are</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
              Real struggles, real numbers, real timeline. Each billionaire's road to first million — movie-style scroll, parallax, film reel markers. Tap Play to watch their real video with Seedwel intro: “Welcome to Seedwel Investment Limited, here is...”
            </p>
          </div>
        </CinematicReveal>

        <div className="space-y-24">
          {expandedHistories.map((person, idx) => {
            // find matching story video
            const mockStory = {
              id: person.id,
              name: person.name,
              country: person.country,
              title: person.industry,
              photo: person.photo,
              quote: person.quote,
              encouragement: person.tagline,
              category: person.industry,
              netWorth: person.netWorth,
              yearsActive: "",
              tags: [],
              video: { youtubeId: idx === 0 ? "AYaEw-kxGdY" : idx === 1 ? "zLZMlE9Czwc" : idx === 2 ? "soWqiVSVNFY" : idx === 3 ? "g0hvHLcTcIc" : idx === 4 ? "cRSAOnEENn8" : "hWeAcYitUYg", title: person.movieTitle, channel: "Seedwel Investment Limited", duration: "12 min" }
            } as any;
            const video = storyToVideo(mockStory);

            return (
              <div key={person.id} className="relative">
                {/* timeline line */}
                <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent hidden md:block -translate-x-1/2" />

                <div className={`grid md:grid-cols-2 gap-8 items-start ${idx % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  {/* photo card */}
                  <Reveal direction={idx % 2 === 0 ? "left" : "right"}>
                    <SpotlightCard className="group rounded-[32px] overflow-hidden bg-gray-900/70 border border-gray-800 hover:border-amber-500/40 transition-all duration-700">
                      <div className="relative h-[380px] overflow-hidden">
                        <img src={person.photo} alt={person.name} className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
                        <div className="absolute top-4 left-4 rounded-full bg-black/70 border border-amber-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">{person.country} • {person.industry}</div>
                        <div className="absolute top-4 right-4 rounded-full bg-black/70 border border-emerald-500/30 px-3 py-1 text-[10px] font-black text-emerald-300">{person.netWorth}</div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                          {video && (
                            <button onClick={() => setPlaying(video)} className="rounded-full bg-amber-500 text-gray-950 font-black px-6 py-3 text-sm flex items-center gap-2 hover:scale-105 transition-transform">
                              <Play className="w-4 h-4 fill-current" /> Watch Movie: {person.movieTitle}
                            </button>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className={`inline-flex rounded-full bg-gradient-to-r ${person.color} px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-950 mb-3`}>🎬 {person.movieTitle}</div>
                          <h3 className="text-3xl font-black text-white leading-none">{person.name}</h3>
                          <p className="text-amber-300 text-sm mt-1 font-medium">{person.tagline}</p>
                        </div>
                      </div>

                      <div className="p-6 space-y-5">
                        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4">
                          <div className="flex items-start gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider"><Quote className="w-4 h-4 shrink-0" /> Their Words</div>
                          <div className="mt-2 text-gray-200 italic">"{person.quote}"</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest font-black text-gray-500">Early Struggle</div>
                          <p className="mt-2 text-sm text-gray-300 leading-relaxed">{person.earlyStruggle}</p>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest font-black text-gray-500">Breakthrough</div>
                          <p className="mt-2 text-sm text-gray-300 leading-relaxed">{person.breakthroughMoment}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-gray-950 border border-gray-800 p-3">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Philosophy</div>
                            <div className="text-xs text-gray-300 mt-1 leading-snug">{person.investmentPhilosophy}</div>
                          </div>
                          <div className="rounded-xl bg-gray-950 border border-gray-800 p-3">
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Lessons for Seedwel</div>
                            <ul className="mt-1 space-y-1">
                              {person.lessons.slice(0, 2).map((l, i) => <li key={i} className="text-[11px] text-gray-400 leading-snug">• {l}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </SpotlightCard>
                  </Reveal>

                  {/* timeline zigzag */}
                  <div className="relative">
                    {/* dot */}
                    <div className="hidden md:flex absolute left-0 top-8 w-10 h-10 rounded-full bg-gray-950 border-2 border-amber-500 items-center justify-center -translate-x-1/2 z-10 shadow-lg shadow-amber-500/20"
                      style={{ left: idx % 2 === 0 ? "-1rem" : "auto", right: idx % 2 === 1 ? "-1rem" : "auto" }}>
                      <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                    </div>

                    <div className="space-y-6 md:ml-8">
                      {person.milestones.map((m, mIdx) => (
                        <Reveal key={m.year} direction={idx % 2 === 0 ? "right" : "left"} delay={mIdx * 90}>
                          <div className="group relative rounded-2xl bg-gray-900/60 border border-gray-800 p-5 hover:border-amber-500/30 hover:-translate-y-1 transition-all duration-300 flex gap-4">
                            <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex flex-col items-center justify-center">
                              <span className="text-lg">{m.icon}</span>
                              <span className="text-[9px] font-black text-amber-300">{m.year}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-black text-white group-hover:text-amber-200">{m.title}</div>
                              <div className="text-xs text-gray-400 mt-1 leading-relaxed">{m.description}</div>
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                                <Clock className="w-3 h-3" /> Lesson: {m.lesson}
                              </div>
                            </div>
                          </div>
                        </Reveal>
                      ))}

                      {/* wealth journey */}
                      <Reveal direction="up">
                        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-gray-900/60 to-gray-900/60 border border-amber-500/20 p-5">
                          <div className="text-[10px] uppercase tracking-widest font-black text-amber-400 mb-3">Net Worth Journey — Movie Money Counter 🎥</div>
                          <div className="grid grid-cols-2 gap-3">
                            {person.wealthJourney.map(w => (
                              <div key={w.age} className="rounded-xl bg-black/40 border border-gray-800 p-3 text-center">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{w.age}</div>
                                <div className="text-xs font-bold text-white mt-1 leading-snug">{w.event}</div>
                                <div className="text-sm font-black text-amber-400 mt-1">{w.amount}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Reveal>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {playing && <BrandedVideoPlayer video={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
