import { useState } from "react";
import {
  Building2,
  Cpu,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Send,
  BadgeDollarSign,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { investmentOpportunities } from "../data/content";
import { postInvestorInquiry } from "../lib/api";
import { cn } from "../utils/cn";

const categoryIcon = (category: string) => {
  if (category.toLowerCase().includes("school")) return Building2;
  if (category.toLowerCase().includes("ai") || category.toLowerCase().includes("tech")) return Cpu;
  return Landmark;
};

export default function InvestPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interestArea: "", amountRange: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      if (!form.interestArea) form.interestArea = investmentOpportunities[0]?.title || "General Investment";
      await postInvestorInquiry(form);
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", interestArea: "", amountRange: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Investment Opportunities"
        title="Invest With"
        highlight="Seedwel"
        description="Open investment opportunities in school building, AI business & strategic real estate — Seedwel Investment Limited, registered 2025."
      />

      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
        {/* Trust strip */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: "Registered Company", text: "Seedwel Investment Limited — officially registered in 2025." },
            { icon: MapPin, title: "Zambia & SADC Focus", text: "Regional HQ led by Country Director Zacheus Simbaya." },
            { icon: BadgeDollarSign, title: "Milestone Escrow", text: "Structured capital release tied to construction milestones." },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl bg-gray-900/70 border border-gray-800 p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <c.icon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-bold text-sm">{c.title}</div>
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Opportunities */}
        <div>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-400" /> Current Opportunities
          </h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {investmentOpportunities.map((o) => {
              const Icon = categoryIcon(o.category);
              return (
                <div key={o.id} className="rounded-3xl bg-gray-900/70 border border-gray-800 p-6 flex flex-col hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                        o.status.toLowerCase().includes("open")
                          ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                          : "bg-sky-500/15 border border-sky-500/40 text-sky-300"
                      )}
                    >
                      {o.status}
                    </span>
                  </div>
                  <h3 className="font-black text-lg leading-snug">{o.title}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-1">{o.category} • {o.location}</p>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed flex-1">{o.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {o.highlights.slice(0, 3).map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" /> {h}
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-3 mt-5 border-t border-gray-800 pt-4 text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500">Minimum</div>
                      <div className="text-sm font-black text-white">{o.minimumInvestment}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500">Projected Return</div>
                      <div className="text-sm font-black text-emerald-400">{o.projectedReturn}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setForm((f) => ({ ...f, interestArea: o.title }));
                      document.getElementById("invest-form")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
                  >
                    Express Interest
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Inquiry form */}
        <div id="invest-form" className="rounded-3xl bg-gray-900/70 border border-gray-800 p-8 max-w-3xl mx-auto scroll-mt-28">
          <h2 className="text-2xl font-black mb-2">Investor Inquiry</h2>
          <p className="text-sm text-gray-400 mb-6">
            Submissions go directly to the Seedwel management deal-flow database and are reviewed by the
            Country Director and Founder.
          </p>

          {status === "sent" ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <div className="font-bold text-emerald-300">Inquiry received</div>
              <p className="text-sm text-gray-400 mt-1">Our team will contact you within 2 business days.</p>
              <button onClick={() => setStatus("idle")} className="mt-4 text-xs text-amber-400 underline">
                Submit another inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
              <input required value={form.name} onChange={set("name")} placeholder="Full name / organization"
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors" />
              <input required type="email" value={form.email} onChange={set("email")} placeholder="Email address"
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors" />
              <input value={form.phone} onChange={set("phone")} placeholder="Phone / WhatsApp (optional)"
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors" />
              <select required value={form.interestArea} onChange={set("interestArea")}
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors">
                <option value="" disabled>Select opportunity…</option>
                {investmentOpportunities.map((o) => (
                  <option key={o.id} value={o.title}>{o.title}</option>
                ))}
                <option value="General Investment">General Investment</option>
              </select>
              <select value={form.amountRange} onChange={set("amountRange")}
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors sm:col-span-2">
                <option value="">Investment range (optional)…</option>
                {["$5,000 - $25,000", "$25,000 - $100,000", "$100,000 - $500,000", "$500,000+"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <textarea value={form.message} onChange={set("message")} rows={4} placeholder="Tell us about your investment goals…"
                className="bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none sm:col-span-2" />
              {status === "error" && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 sm:col-span-2">
                  {error}
                </div>
              )}
              <button type="submit" disabled={status === "sending"}
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold py-3.5 text-sm hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-60">
                {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {status === "sending" ? "Submitting…" : "Submit Investor Inquiry"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
