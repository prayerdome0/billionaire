import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Loader2, Mail, Newspaper, Send, Tag } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { posts, getFounder, type BlogPost } from "../data/content";
import { subscribeNewsletter } from "../lib/api";

function NewsletterBox() {
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
    <div className="bg-gradient-to-br from-gray-900 to-gray-900/60 border border-amber-500/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <Mail className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
          The Weekly <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Wealth Brief</span>
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-6">
          One actionable wealth lesson, one founder note, and one niche deep-dive — every Friday.
          Subscribers are stored in the database via <code className="text-amber-500/80">POST /api/newsletter</code>.
        </p>
        {status === "sent" ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle className="w-5 h-5" /> You're in! Check your inbox for a welcome note.
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
            >
              {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Subscribe
            </button>
          </form>
        )}
        {status === "error" && <p className="text-rose-400 text-sm mt-3">{error}</p>}
      </div>
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const author = getFounder(post.authorId);
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col bg-gray-900/60 border border-gray-800 rounded-2xl p-7 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-mono text-gray-600">{post.date}</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-500">{post.readTime}</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors leading-snug">
        {post.title}
      </h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-5 flex-1">{post.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {author && (
            <img src={author.photo} alt={author.name} className="w-8 h-8 rounded-full object-cover object-top border border-amber-500/30" />
          )}
          <span className="text-xs text-gray-400">{author?.name ?? "The Team"}</span>
        </div>
        <span className="flex items-center gap-1.5 text-amber-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          Read <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

export default function BlogPage() {
  const [filter, setFilter] = useState("all");
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const filtered = filter === "all" ? posts : posts.filter((p) => p.tags.includes(filter));

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="The Blog"
        title="Insights From the"
        highlight="Founders"
        description="Practical, no-fluff essays from the team — investing frameworks, pricing plays, AI strategy, real estate math, and the mindset behind it all."
      />

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setFilter("all")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                filter === "all"
                  ? "bg-amber-500 text-gray-900 border-amber-500 font-bold"
                  : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" /> All ({posts.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  filter === tag
                    ? "bg-amber-500 text-gray-900 border-amber-500 font-bold"
                    : "bg-gray-800/60 border-gray-700 text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
                }`}
              >
                <Tag className="w-3.5 h-3.5" /> {tag}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          <div className="mt-16">
            <NewsletterBox />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
