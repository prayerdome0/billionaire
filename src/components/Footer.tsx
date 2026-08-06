import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Crown, Loader2, Mail, Newspaper, Send, Users, TerminalSquare, ShieldCheck, Briefcase } from "lucide-react";
import { subscribeNewsletter } from "../lib/api";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await subscribeNewsletter(email);
      setStatus("sent");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <span className="text-white font-bold text-lg">Billionaire Blueprint</span>
                <p className="text-gray-500 text-xs">Your guide to extraordinary wealth</p>
              </div>
            </Link>
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">
              28 lessons, 7 video masterclasses, founder mentorship, and a live SQLite-backed API —
              all in one platform.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-gray-500">
            <p className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-2">Explore</p>
            <Link to="/lessons" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Lessons
            </Link>
            <Link to="/founders" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Founders & Leadership
            </Link>
            <Link to="/founders#invest" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-emerald-400">
              <Briefcase className="w-3.5 h-3.5" /> Invest With Us
            </Link>
            <Link to="/api-docs" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <TerminalSquare className="w-3.5 h-3.5" /> API & Database
            </Link>
            <Link to="/admin" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-400/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </Link>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-gray-600 font-semibold mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Weekly Wealth Brief
            </p>
            {status === "sent" ? (
              <p className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Subscribed — welcome aboard!
              </p>
            ) : (
              <form onSubmit={submit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 bg-gray-900/70 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-4 py-2.5 rounded-lg text-sm hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
                >
                  {status === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Join
                </button>
              </form>
            )}
            {status === "error" && <p className="text-rose-400 text-xs mt-2">{error}</p>}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800/50 text-center">
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} Seedwel Investment Limited (Registered 2025). Founder Mr. Seedwell Khayalethu Masuku • Zambia Country Director Zacheus Simbaya.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Open for investors in school building, AI business, and software developers.
          </p>
          <p className="text-gray-700 text-xs mt-2">
            Powered by a SQLite database &amp; REST API —{" "}
            <Link to="/api-docs" className="text-amber-500/80 hover:text-amber-400">
              explore the live API
            </Link>{" "}
            •{" "}
            <Link to="/admin" className="text-amber-500/80 hover:text-amber-400">
              admin portal
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
