import { useState } from "react";
import {
  CheckCircle,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { postContact } from "../lib/api";

const companyPhones = [
  { label: "Zambia", number: "+260 973 028 342" },
  { label: "Eswatini", number: "+268 7658 1804" },
  { label: "Ireland", number: "+353 87 000 5227" },
];

const companyEmail = "seedwelinvestmentltd@gmail.com";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General inquiry", message: "" });
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
      setForm({ name: "", email: "", subject: "General inquiry", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Contact Us"
        title="Get in"
        highlight="Touch"
        description="We welcome inquiries from learners, investors, partners, educators, and professionals. Reach out to us."
      />

      <section className="pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Contact info */}
            <div className="space-y-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <Phone className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-white mb-3">Call / WhatsApp</h3>
                <div className="space-y-2">
                  {companyPhones.map((phone, i) => (
                    <a key={i} href={`tel:${phone.number.replace(/\s/g, "")}`} className="flex items-center gap-2 text-gray-400 text-sm hover:text-amber-400 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{phone.label}: {phone.number}</span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <Mail className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-white mb-1">Email</h3>
                <a href={`mailto:${companyEmail}`} className="text-gray-400 text-sm hover:text-amber-400 transition-colors">
                  {companyEmail}
                </a>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <MapPin className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-white mb-1">Location</h3>
                <p className="text-gray-400 text-sm">Zambia</p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <Globe className="w-6 h-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-white mb-1">Business</h3>
                <p className="text-gray-400 text-sm">Education • Technology • Investment</p>
                <p className="text-gray-500 text-xs mt-1">📈💼📞💻📱</p>
              </div>
            </div>

            {/* Contact form */}
            <div className="md:col-span-2 bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <h2 className="text-xl font-black text-white mb-6">Send Us a Message</h2>
              {status === "sent" ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <div className="font-bold text-emerald-300">Message sent!</div>
                  <p className="text-sm text-gray-400 mt-1">Thank you for reaching out. We will get back to you soon.</p>
                  <button onClick={() => setStatus("idle")} className="mt-4 text-xs text-amber-400 underline">
                    Send another message
                  </button>
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
                        placeholder="Your full name"
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
                        placeholder="you@example.com"
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
                      <option>General inquiry</option>
                      <option>Course question</option>
                      <option>Partnership opportunity</option>
                      <option>Investment inquiry</option>
                      <option>Career inquiry</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={update("message")}
                      placeholder="Tell us how we can help..."
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
          </div>

          {/* Our People */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="text-amber-400 text-sm font-semibold tracking-widest uppercase">Our People</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-3">
                Leadership
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-gray-950 font-black text-xl">
                    SM
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Mr. Seedwell Khayalethu Masuku</h3>
                    <p className="text-amber-400 text-sm font-semibold">Founder</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Mr. Seedwell Khayalethu Masuku is the founder of the company and provides the overall vision and strategic direction of the organization. His vision is centered on building an organization that creates opportunities through education, technology, skills development, and investment.
                </p>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-gray-950 font-black text-xl">
                    ZS
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Zambia Country Director</h3>
                    <p className="text-emerald-400 text-sm font-semibold">Country Director — Zambia</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The Zambia Country Director is responsible for supporting the company's operations, development, partnerships, and growth within Zambia. The Zambia office plays an important role in developing local partnerships, identifying opportunities, supporting learners, and contributing to the company's long-term education and investment vision.
                </p>
              </div>
            </div>
          </div>

          {/* Registration */}
          <div className="bg-gradient-to-br from-amber-500/10 via-gray-900/80 to-gray-950 border border-amber-500/30 rounded-3xl p-8 md:p-10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <h3 className="font-bold text-white mb-2">Company Registration</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The company operates in Zambia as a legally registered business under the <strong className="text-white">Patents and Companies Registration Agency (PACRA)</strong>. The company's registration details can be displayed on the website where appropriate and where the information is officially verified.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
