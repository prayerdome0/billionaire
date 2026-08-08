import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, Lightbulb, TrendingUp, School, Zap, MessageSquare } from "lucide-react";
import { generateAIResponse, freeAITemplates, mentorPersonas } from "../data/aiKnowledge";
import Reveal from "./Reveal";
import { SpotlightCard, TypewriterText } from "./Cinematic";

interface ChatMsg {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestions?: string[];
  persona?: string;
}

export function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: "welcome", role: "ai", text: freeAITemplates.welcome, suggestions: ["I have no capital, roast my excuse", "Give me AI business idea for schools", "What would Buffet invest in Zambia?", "Assign 365 day challenge today"] }
  ]);
  const [persona, setPersona] = useState("zacheus");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (txt?: string) => {
    const q = (txt || input).trim();
    if (!q) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", text: q };
    setMsgs(m => [...m, userMsg]);
    setInput("");
    setTyping(true);
    // simulate free AI API with local logic (no key)
    setTimeout(() => {
      const res = generateAIResponse(q, persona);
      const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: "ai", text: res.reply, suggestions: res.suggestions, persona };
      setMsgs(m => [...m, aiMsg]);
      setTyping(false);
      // try API endpoint for free AI (if server available) — fire and forget
      try {
        fetch(`/api/ai/mentor?question=${encodeURIComponent(q)}&persona=${persona}`).catch(() => {});
      } catch {}
    }, 700 + Math.random() * 800);
  };

  const activePersona = mentorPersonas.find(p => p.id === persona) || mentorPersonas[4];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[80] w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-950 shadow-2xl shadow-amber-500/30 flex items-center justify-center hover:scale-110 transition-transform animate-bounce-soft"
          aria-label="Open free AI assistant"
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-950 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90] w-[92vw] md:w-[420px] h-[560px] max-h-[80vh] rounded-[24px] bg-gray-950 border border-gray-800 shadow-2xl shadow-black/80 flex flex-col overflow-hidden animate-cinematic-zoom">
          {/* header cinematic */}
          <div className="relative p-4 bg-gradient-to-br from-gray-900 to-gray-950 border-b border-gray-800 shrink-0">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.15),transparent_60%)]" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={activePersona.avatar} alt={activePersona.name} className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/30" />
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black text-white">{activePersona.name}</div>
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">Free AI • No Key</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{activePersona.role} • {activePersona.style}</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            {/* persona switch */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {mentorPersonas.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold border transition-all ${persona === p.id ? "bg-amber-500 text-gray-950 border-amber-400" : "bg-gray-900 border-gray-800 text-gray-500 hover:border-amber-500/30 hover:text-gray-300"}`}
                >
                  {p.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-to-br from-amber-500 to-yellow-500 text-gray-950 font-medium rounded-br-sm" : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-sm"}`}>
                  {m.role === "ai" ? (
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  ) : m.text}
                  {m.suggestions && m.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {m.suggestions.map(s => (
                        <button key={s} onClick={() => send(s)} className="rounded-full bg-gray-950 border border-gray-800 hover:border-amber-500/40 px-3 py-1 text-[11px] font-medium text-amber-300 transition-colors text-left">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-900 border border-gray-800 px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <span className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.15s]" /><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.3s]" /></span>
                  {activePersona.name.split(" ")[0]} is writing...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* input */}
          <div className="p-3 bg-gray-900 border-t border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask free AI: idea, investment, roast excuse..." className="w-full rounded-full bg-gray-950 border border-gray-800 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 pr-10" />
                <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              </div>
              <button onClick={() => send()} disabled={!input.trim()} className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 text-gray-950 flex items-center justify-center hover:scale-105 disabled:opacity-40 transition-all"><Send className="w-5 h-5" /></button>
            </div>
            <div className="mt-2 text-center text-[10px] text-gray-600 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-amber-500/60" /> Free AI API • No key • No limit • Powered by Seedwel local intelligence
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Full page AI studio
export function AIFeaturesShowcase() {
  const features = [
    { icon: Lightbulb, title: "AI Mentor Chat", desc: "5 personas: Dangote, Buffett, Oprah, Strive, Zacheus. Ask anything, get blunt Zambian-context advice. No key.", color: "from-amber-400 to-yellow-500", query: "Give me business idea with $0" },
    { icon: TrendingUp, title: "Wealth Plan Generator", desc: "Income, goal, risk → 12-month $1M roadmap with 70/20/10 split. Free.", color: "from-emerald-400 to-teal-500", query: "Make me plan: earn $800, goal $10k" },
    { icon: School, title: "School Investment Calculator", desc: "Input amount, see 10-year yield, equity, jobs created, students served. Movie counter animation.", color: "from-sky-400 to-blue-500", query: "Calculate $5000 school invest 16%" },
    { icon: Zap, title: "AI Idea Engine", desc: "Industry → 4 validated ideas with price, customer, MRR math. Filter Zambia-ready.", color: "from-violet-400 to-purple-500", query: "Ideas for agriculture AI" },
  ];

  const [demo, setDemo] = useState<string | null>(null);

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl animate-float" />
      </div>
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <Reveal className="text-center mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1 text-[11px] font-black tracking-widest uppercase text-amber-300"><Sparkles className="w-3.5 h-3.5" /> Free AI API • No Key Required • Built-In</span>
          <h2 className="mt-6 text-4xl md:text-5xl font-black leading-tight">
            <span className="text-white">Free AI That </span><span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent"> Actually Helps You Earn</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
            No OpenAI key, no payment, no limit. Local intelligence trained on Seedwel data + billionaire lessons + Zambia investment reality. 
            6 endpoints: mentor, ideas, wealth plan, tip, challenge, investor calculator. Try live below.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <Reveal key={f.title} direction="up" delay={i * 90}>
              <SpotlightCard className="group rounded-[24px] bg-gray-950/80 border border-gray-800 p-6 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-gray-950 shrink-0 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white">{f.title}</div>
                    <div className="text-gray-400 text-xs mt-1 leading-relaxed">{f.desc}</div>
                    <button onClick={() => setDemo(f.query)} className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-900 border border-gray-800 px-3 py-1.5 text-[11px] font-bold text-amber-300 hover:border-amber-500/40 transition-colors">
                      Try: "{f.query}" <Sparkles className="w-3 h-3" />
                    </button>
                    {demo === f.query && (
                      <div className="mt-4 rounded-xl bg-black/40 border border-amber-500/20 p-4">
                        <TypewriterText text={generateAIResponse(f.query).reply.slice(0, 280) + "..."} speed={15} className="text-xs text-gray-300 leading-relaxed" />
                      </div>
                    )}
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 rounded-[24px] bg-gradient-to-br from-amber-500/10 via-gray-900/60 to-gray-950 border border-amber-500/20 p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="text-sm font-black text-white">Free AI API for Developers</div>
              <div className="text-xs text-gray-400 mt-1 font-mono">GET /api/ai/mentor?question=... &nbsp; POST /api/ai/chat &nbsp; GET /api/ai/ideas?industry=... &nbsp; POST /api/ai/wealth-plan &nbsp; GET /api/ai/tip</div>
              <div className="mt-3 text-[11px] text-gray-500">No auth for GET • POST needs student login but still free. 100% local logic, no external key, works offline.</div>
            </div>
            <div className="shrink-0">
              <div className="rounded-xl bg-black/60 border border-gray-800 px-4 py-3 font-mono text-[11px] text-amber-300">
                curl /api/ai/tip<br />{`→ { "tip": "School buildings are forever assets..." }`}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
