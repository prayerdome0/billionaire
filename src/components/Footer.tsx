import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Loader2, Mail, Send, MapPin, Phone } from "lucide-react";
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
    <footer className="bg-gray-950 border-t border-gray-800 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3.5 group">
              <img
                src="/images/seedwel-logo.svg"
                alt="Seedwel Investment Limited Logo"
                className="w-12 h-12 object-contain group-hover:scale-105 transition-transform shrink-0"
              />
              <div>
                <span className="text-white font-bold text-lg block">Seedwel Investment</span>
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mt-0.5">Limited</span>
              </div>
            </Link>
            <p className="text-gray-500 text-sm mt-4 leading-relaxed">
              Building opportunities through education, skills development, technology, and sustainable investment.
            </p>
            <p className="text-gray-600 text-xs mt-3">
              Registered in Zambia under PACRA
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2.5 text-sm text-gray-400">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">Explore</p>
            <Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link>
            <Link to="/courses" className="hover:text-amber-400 transition-colors">Courses</Link>
            <Link to="/services" className="hover:text-amber-400 transition-colors">Services</Link>
            <Link to="/certificates" className="hover:text-amber-400 transition-colors">Certificates</Link>
            <Link to="/inspiration" className="hover:text-amber-400 transition-colors">Inspiration</Link>
            <Link to="/careers" className="hover:text-amber-400 transition-colors">Careers</Link>
            <Link to="/investment" className="hover:text-amber-400 transition-colors text-emerald-400">Investment</Link>
            <Link to="/partnerships" className="hover:text-amber-400 transition-colors">Partnerships</Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2.5 text-sm text-gray-400">
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2">Contact</p>
            <a href="tel:+260973028342" className="hover:text-amber-400 transition-colors flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500/60" /> +260 973 028 342
            </a>
            <a href="tel:+26876581804" className="hover:text-amber-400 transition-colors flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500/60" /> +268 7658 1804
            </a>
            <a href="tel:+353870005227" className="hover:text-amber-400 transition-colors flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-500/60" /> +353 87 000 5227
            </a>
            <a href="mailto:seedwelinvestmentltd@gmail.com" className="hover:text-amber-400 transition-colors flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-500/60" /> seedwelinvestmentltd@gmail.com
            </a>
            <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-amber-500/60" /> Zambia</span>
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Stay Updated
            </p>
            {status === "sent" ? (
              <p className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Subscribed — thank you!
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
                </button>
              </form>
            )}
            {status === "error" && <p className="text-rose-400 text-xs mt-2">{error}</p>}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800/50 text-center">
          <p className="text-gray-500 text-sm font-medium">
            © {new Date().getFullYear()} Seedwel Investment Limited. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Founded by Mr. Seedwell Khayalethu Masuku • Zambia Country Director — Registered under PACRA
          </p>
        </div>
      </div>
    </footer>
  );
}
