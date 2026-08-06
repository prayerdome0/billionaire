import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AtSign,
  Award,
  CheckCircle,
  Globe,
  Loader2,
  Mail,
  Quote,
  Send,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { fetchFounders, postContact } from "../lib/api";
import { testimonials, type Founder } from "../data/content";
import { cn } from "../utils/cn";

const roleGradient: Record<string, string> = {
  "Co-Founder & CEO": "from-amber-400 to-yellow-600",
  "Co-Founder & Head of Education": "from-emerald-400 to-teal-600",
  "Co-Founder & Director of Investments": "from-sky-400 to-blue-600",
  "Co-Founder & Head of Innovation": "from-rose-400 to-red-600",
};

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "Mentorship question", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await postContact(form);
      setStatus("sent");
      setForm({ name: "", email: "", subject: "Mentorship question", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 md:p-10">
      <div className="flex items-center gap-3 mb-2">
        <Mail className="w-6 h-6 text-amber-400" />
        <h2 className="text-2xl font-black text-white">Message the Founders</h2>
      </div>
      <p className="text-gray-500 text-sm mb-8">
        Questions about the curriculum, mentoring, or partnerships? Messages are stored in the SQLite database via{" "}
        <code className="text-amber-500/80">POST /api/contact</code>.
      </p>

      {status === "sent" ? (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
          <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-emerald-300">Message sent!</p>
            <p className="text-sm text-emerald-400/80">
              It's now a row in the <code className="text-emerald-300">contact_messages</code> table — check it live on the{" "}
              <Link to="/api-docs" className="underline">API page</Link>.
            </p>
            <button onClick={() => setStatus("idle")} className="text-sm text-emerald-400 underline mt-3">
              Send another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Name</label>
              <input
                required
                value={form.name}
                onChange={update("name")}
                placeholder="Ada Lovelace"
                className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="ada@example.com"
                className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Subject</label>
            <select
              value={form.subject}
              onChange={update("subject")}
              className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
            >
              <option>Mentorship question</option>
              <option>Partnership inquiry</option>
              <option>Speaking request</option>
              <option>Feedback on the course</option>
              <option>Press</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={update("message")}
              placeholder="Tell us where you are in your journey and what you need..."
              className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
            />
          </div>
          {status === "error" && <p className="text-rose-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
          >
            {status === "sending" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}
    </div>
  );
}

function FounderCard({ founder }: { founder: Founder }) {
  const gradient = roleGradient[founder.role] ?? "from-amber-400 to-yellow-600";
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-3xl overflow-hidden hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <img
          src={founder.photo}
          alt={`${founder.name} — ${founder.role}`}
          className="w-full h-72 md:h-80 object-cover object-top"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-black text-white">{founder.name}</h3>
            <p className="text-amber-400 font-medium text-sm">{founder.role}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", gradient)}>
            <Award className="w-5 h-5 text-gray-950" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-400 text-sm leading-relaxed mb-4">{founder.bio}</p>

        <blockquote className="bg-amber-500/5 border-l-2 border-amber-500 rounded-r-xl px-4 py-3 mb-5">
          <Quote className="w-4 h-4 text-amber-500/50 mb-1" />
          <p className="text-gray-300 text-sm italic">"{founder.quote}"</p>
        </blockquote>

        <div className="flex flex-wrap gap-2 mb-5">
          {founder.focus.map((f) => (
            <span key={f} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-800/80 text-gray-300">
              <Target className="w-3 h-3 text-amber-400" /> {f}
            </span>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-5 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span><span className="text-gray-400 font-semibold">Fun fact:</span> {founder.funFact}</span>
        </p>

        <div className="flex items-center justify-between border-t border-gray-800 pt-4">
          <span className="text-xs text-gray-500 font-mono">{founder.email}</span>
          <div className="flex items-center gap-3">
            <a href={founder.socials.linkedin} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-amber-400 transition-colors" aria-label="LinkedIn">
              <Globe className="w-4 h-4" />
            </a>
            <a href={founder.socials.twitter} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-amber-400 transition-colors" aria-label="Twitter / X">
              <AtSign className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FoundersPage() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchFounders()
      .then((f) => mounted && setFounders(f))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="The Team"
        title="Meet the"
        highlight="Founders"
        description="Four operators, $4B+ in combined outcomes across finance, tech, real estate, and education. They built this curriculum the hard way — so you don't have to."
      >
        <div className="mt-8 grid grid-cols-3 gap-6 max-w-md mx-auto">
          {[
            ["$4B+", "Combined deal value"],
            ["30+", "Years experience"],
            ["120K", "Students taught"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-amber-400">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </PageHeader>

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-20">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading founders from the API...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {founders.map((f) => (
                <FounderCard key={f.id} founder={f} />
              ))}
            </div>
          )}

          {/* Testimonials */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Student Results</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3">
                What Students{" "}
                <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Say</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-7">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="mt-24 max-w-3xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
