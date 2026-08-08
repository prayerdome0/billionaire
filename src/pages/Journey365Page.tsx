import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Flame, Trophy, Calendar, Clock, ArrowRight, Sparkles, Medal, Target, Play, PenLine, Zap, TrendingUp, Award, Bot } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Reveal from "../components/Reveal";
import { CinematicReveal, FilmReelTicker, CountUp, SpotlightCard, ParticleField } from "../components/Cinematic";
import { challenges365, type DailyChallenge, currentDayFromStart } from "../data/challenge365";
import { getProgress, completeDay, isCompleted, stats as getStats, getStartDate, getCurrentDay, setStartDate } from "../lib/challengeStore";
import { generateAIResponse } from "../data/aiKnowledge";
import BrandedVideoPlayer from "../components/BrandedVideoPlayer";
import { storyToVideo } from "../lib/storyVideo";
import { successStories } from "../data/content";
import type { VideoWithStats } from "../lib/api";

function ChallengeCard({ ch, onComplete, onPlay }: { ch: DailyChallenge; onComplete: () => void; onPlay: (v: VideoWithStats) => void }) {
  const done = isCompleted(ch.day);
  const [note, setNote] = useState("");
  const related = successStories.find(s => s.quote.includes(ch.quoteAuthor.split(" ")[0])) || successStories[ch.day % successStories.length];
  const video = related ? storyToVideo(related as any) : null;

  return (
    <SpotlightCard className={`group rounded-[28px] border p-6 transition-all duration-500 ${done ? "bg-emerald-950/20 border-emerald-500/30" : "bg-gray-900/60 border-gray-800 hover:border-amber-500/40 hover:-translate-y-1"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border ${done ? "bg-emerald-500 text-gray-950 border-emerald-400" : ch.difficulty === "Starter" ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : ch.difficulty === "Builder" ? "bg-sky-500/15 border-sky-500/30 text-sky-400" : ch.difficulty === "Warrior" ? "bg-violet-500/15 border-violet-500/30 text-violet-400" : "bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400"}`}>
            {done ? <Check className="w-5 h-5" /> : ch.day}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-gray-950 border border-gray-800 text-gray-400">{ch.category}</span>
              <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full border ${ch.difficulty === "Starter" ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : ch.difficulty === "Builder" ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "bg-violet-500/10 border-violet-500/30 text-violet-300"}`}>{ch.difficulty} • {ch.points} pts</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500"><Clock className="w-3 h-3" /> {ch.timeMinutes} min</span>
            </div>
            <h3 className="mt-2 text-lg font-black text-white leading-tight group-hover:text-amber-100">{ch.title}</h3>
          </div>
        </div>
        {video && (
          <button onClick={() => onPlay(video!)} className="shrink-0 w-10 h-10 rounded-full bg-gray-950 border border-gray-800 flex items-center justify-center hover:border-amber-500/40 hover:bg-amber-500/10 transition-colors group-hover:scale-110">
            <Play className="w-4 h-4 text-amber-400 fill-current" />
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-400 leading-relaxed">{ch.description}</p>

      <div className="mt-5 space-y-2">
        <div className="text-[10px] uppercase tracking-widest font-black text-gray-500">Action Steps — Do Before Midnight 🎯</div>
        {ch.actions.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
            <span className="mt-1 w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">{i + 1}</span>
            <span className="leading-snug">{a}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-black/40 border border-gray-800 p-4">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 mt-0.5">💬</span>
          <div>
            <div className="text-xs italic text-gray-300">"{ch.quote}"</div>
            <div className="text-[11px] font-bold text-amber-300 mt-1">— {ch.quoteAuthor}</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-gray-500 flex items-center gap-2"><PenLine className="w-3 h-3" /> Reflection: {ch.reflection}</div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        {!done ? (
          <>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="What did you learn? (optional)" className="flex-1 rounded-xl bg-gray-950 border border-gray-800 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50" />
            <button onClick={() => { completeDay(ch.day, note, ch.timeMinutes); onComplete(); }} className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black px-5 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center gap-2">
              <Check className="w-4 h-4" /> Done • +{ch.points}
            </button>
          </>
        ) : (
          <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-300 flex items-center gap-2"><Trophy className="w-4 h-4" /> Completed • {ch.reward}</span>
            <span className="text-[11px] text-emerald-400/70">Day {ch.day} conquered</span>
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}

export default function Journey365Page() {
  const [start, setStartState] = useState(getStartDate());
  const [filterCat, setFilterCat] = useState<string>("All");
  const [showOnly, setShowOnly] = useState<"all" | "todo" | "done">("all");
  const [playing, setPlaying] = useState<VideoWithStats | null>(null);
  const [progressTick, setProgressTick] = useState(0);
  const [aiCoach, setAiCoach] = useState<string>("");

  const currentDay = getCurrentDay(start);
  const s = getStats();
  const progress = getProgress();

  useEffect(() => {
    // generate coach tip
    const dayChallenge = challenges365[currentDay - 1];
    const ai = generateAIResponse(`Coach me for Day ${currentDay}: ${dayChallenge.title}. I am ${s.level} level, streak ${s.streak}.`);
    setAiCoach(ai.reply.slice(0, 400));
  }, [progressTick, currentDay]);

  const filtered = challenges365.filter(c => {
    if (filterCat !== "All" && c.category !== filterCat) return false;
    if (showOnly === "todo" && isCompleted(c.day)) return false;
    if (showOnly === "done" && !isCompleted(c.day)) return false;
    return true;
  });

  const todayChallenge = challenges365[currentDay - 1];
  const weeksTotal = 52;
  const currentWeek = Math.floor((currentDay - 1) / 7) + 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* cinematic hero */}
      <section className="relative min-h-[66vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <ParticleField count={100} />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/80 to-gray-950" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-amber-500/[0.06] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-5 py-2 text-xs font-black tracking-widest uppercase text-amber-300">
              <Flame className="w-4 h-4" /> Journey to Success Challenge • 365 Days • Movie Edition 🎬
            </span>
          </Reveal>
          <CinematicReveal delay={120}>
            <h1 className="mt-8 text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
              <span className="block text-white">365 DAYS.</span>
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">ONE SHOT TO CHANGE</span>
              <span className="block text-white">YOUR BLOODLINE.</span>
            </h1>
            <p className="mt-6 text-gray-400 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
              Just like a movie — Act 1 Starter (Day 1-30): identity, cash truth, first $100. Act 2 Builder (31-90): validation, 10 sales. Act 3 Warrior (91-180): scale, automate. Act 4 Billionaire (181-365): 3 engines, legacy. Real animations, film grain, spotlight, parallax, Ken Burns photos. Each day 15-90 mins, points, streak, AI coach, video of successful person.
            </p>
          </CinematicReveal>

          <Reveal className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4"><div className="text-3xl font-black text-amber-400"><CountUp target={s.completed} /></div><div className="text-[10px] uppercase tracking-wider text-gray-500">Completed</div><div className="text-[11px] text-gray-600 mt-1">/ 365</div></div>
            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4"><div className="text-3xl font-black text-white">{s.pct}%</div><div className="text-[10px] uppercase tracking-wider text-gray-500">Progress</div><div className="w-full h-1.5 rounded-full bg-gray-800 mt-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-1000" style={{ width: `${s.pct}%` }} /></div></div>
            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4"><div className="flex items-center justify-center gap-1 text-3xl font-black text-orange-400"><Flame className="w-6 h-6" /> <CountUp target={s.streak} /></div><div className="text-[10px] uppercase tracking-wider text-gray-500">Day Streak</div></div>
            <div className="rounded-2xl bg-gray-900/70 border border-gray-800 p-4"><div className="text-2xl font-black text-white">{s.level}</div><div className="text-[10px] uppercase tracking-wider text-gray-500">Level</div><div className="text-[11px] text-amber-300 mt-1">{s.totalPoints} pts</div></div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 col-span-2 md:col-span-1"><div className="text-[10px] uppercase tracking-wider text-amber-400 font-black">Today</div><div className="text-xl font-black text-white mt-1">Day {currentDay}</div><div className="text-[10px] text-gray-400">Week {currentWeek}/{weeksTotal}</div></div>
          </Reveal>

          <Reveal className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#today" className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black px-8 py-3.5 text-sm hover:from-amber-400 hover:to-yellow-400 transition-all flex items-center gap-2">
              <Target className="w-4 h-4" /> Jump to Today — Day {currentDay}
            </a>
            <button onClick={() => { const d = new Date().toISOString(); setStartDate(d); setStartState(d); setProgressTick(x => x + 1); }} className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-3.5 text-sm font-bold text-gray-300 hover:border-amber-500/30 transition-colors">
              Restart Journey Today
            </button>
          </Reveal>
        </div>
      </section>

      <FilmReelTicker items={["Day 1: Identity Shift 🎬", "Day 30: First $100 Proof", "Day 90: 10 Sales Validation", "Day 180: Warrior Scale", "Day 365: Bloodline Changed", "Free AI Coach • No Key • No Limit", "Investment Photos • Real Zambia Sites", "Success Histories • Movie Timeline"]} />

      {/* Today highlight */}
      <section id="today" className="py-16 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal className="flex items-center gap-3 mb-6">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl md:text-3xl font-black">Today's Mission — <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Day {currentDay}</span></h2>
            <span className="ml-auto flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300"><Calendar className="w-3 h-3" /> {new Date().toLocaleDateString()}</span>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChallengeCard ch={todayChallenge} onComplete={() => setProgressTick(x => x + 1)} onPlay={setPlaying} />
            </div>
            <div className="space-y-4">
              <SpotlightCard className="rounded-[24px] bg-gradient-to-br from-amber-500/10 via-gray-900/60 to-gray-950 border border-amber-500/20 p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300"><Bot className="w-4 h-4" /> Free AI Coach for Today • No Key</div>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{aiCoach}...</p>
                <Link to="/invest" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:gap-3 transition-all">Invest in your journey <ArrowRight className="w-3 h-3" /></Link>
              </SpotlightCard>

              {/* calendar mini */}
              <div className="rounded-[24px] bg-gray-900/60 border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-black">Week {currentWeek} • 7 Days</div>
                  <div className="text-[11px] text-gray-500">Tap to jump</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {challenges365.slice((currentWeek - 1) * 7, currentWeek * 7).map(c => {
                    const done = isCompleted(c.day);
                    const isToday = c.day === currentDay;
                    return (
                      <a key={c.day} href={`#day-${c.day}`} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-bold border transition-all ${isToday ? "bg-amber-500 text-gray-950 border-amber-400 scale-110 shadow-lg" : done ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-gray-950 border-gray-800 text-gray-500 hover:border-amber-500/30 hover:text-white"}`}>
                        <span>{c.day}</span>
                        {done && <Check className="w-3 h-3 mt-0.5" />}
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[24px] bg-gray-900/60 border border-gray-800 p-6">
                <div className="text-sm font-black flex items-center gap-2"><Medal className="w-4 h-4 text-amber-400" /> Rewards Roadmap</div>
                <div className="mt-4 space-y-3">
                  {[{ days: 7, reward: "Week 1 Survivor — Director's Cut Badge" }, { days: 30, reward: "$100 Club — First Proof" }, { days: 90, reward: "Builder — 10 Sales Validator" }, { days: 180, reward: "Warrior — Systems Operator" }, { days: 365, reward: "Billionaire — Bloodline Changed 🏆" }].map(r => (
                    <div key={r.days} className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs ${s.completed >= r.days ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-gray-950 border-gray-800 text-gray-500"}`}>
                      <span>{r.days} days → {r.reward}</span>
                      {s.completed >= r.days ? <Trophy className="w-4 h-4" /> : <span className="text-[10px]">{r.days - s.completed} left</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* filters + full list */}
      <section className="pb-24 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3 mb-8 sticky top-[72px] z-10 bg-gray-950/80 backdrop-blur-xl py-4 -mx-4 px-4 border-y border-gray-900/50">
            <div className="flex items-center gap-2">
              {["All", "Mindset", "Money", "Business", "Investment", "AI", "Skills", "Network", "Health"].map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} className={`rounded-full px-3.5 py-2 text-[11px] font-bold border transition-all ${filterCat === cat ? "bg-amber-500 text-gray-950 border-amber-400" : "bg-gray-900 border-gray-800 text-gray-400 hover:border-amber-500/30"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {(["all", "todo", "done"] as const).map(f => (
                <button key={f} onClick={() => setShowOnly(f)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold border ${showOnly === f ? "bg-white text-gray-950" : "bg-gray-900 border-gray-800 text-gray-500"}`}>{f === "all" ? "All Days" : f === "todo" ? "Todo" : "Done ✓"}</button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.slice(0, 50).map(ch => (
              <div key={ch.day} id={`day-${ch.day}`}>
                <ChallengeCard ch={ch} onComplete={() => setProgressTick(x => x + 1)} onPlay={setPlaying} />
              </div>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <div className="inline-flex flex-col items-center gap-3 rounded-[20px] bg-gray-900/60 border border-gray-800 px-8 py-6">
              <div className="text-sm text-gray-400">Showing {filtered.slice(0, 50).length} of {filtered.length} challenges. Full 365 in API.</div>
              <div className="flex gap-3">
                <a href="/api/challenge/365" target="_blank" className="text-xs text-amber-400 underline">View 365 as JSON API (free)</a>
                <a href="/api/ai/daily-challenge?day=1" target="_blank" className="text-xs text-amber-400 underline">AI Daily Challenge API</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {playing && <BrandedVideoPlayer video={playing} onClose={() => setPlaying(null)} />}
      <Footer />
    </div>
  );
}
