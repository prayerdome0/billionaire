import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Quote, Tag } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getFounder, getPost, posts } from "../data/content";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-black text-white mb-3">Post not found</h1>
          <p className="text-gray-500 mb-8">The article you're looking for doesn't exist.</p>
          <Link to="/blog" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl">
            Back to the Blog
          </Link>
        </div>
      </div>
    );
  }

  const author = getFounder(post.authorId);
  const idx = posts.findIndex((p) => p.slug === post.slug);
  const next = idx >= 0 && idx < posts.length - 1 ? posts[idx + 1] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <header className="relative pt-36 pb-14 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-400 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All posts
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {post.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <Tag className="w-3 h-3" /> {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">{post.title}</h1>
          <p className="text-gray-400 text-lg mb-6 leading-relaxed">{post.excerpt}</p>
          <div className="flex items-center gap-4">
            {author && (
              <img src={author.photo} alt={author.name} className="w-11 h-11 rounded-full object-cover object-top border border-amber-500/30" />
            )}
            <div>
              <div className="text-white font-semibold text-sm">{author?.name ?? "The Team"}</div>
              <div className="text-gray-500 text-xs">{author?.role ?? "Billionaire Blueprint"}</div>
            </div>
            <div className="ml-auto flex items-center gap-4 text-gray-500 text-xs">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {post.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="pb-20">
        <article className="max-w-3xl mx-auto px-4 space-y-10">
          {post.content.map((section, i) => (
            <div key={i}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-gray-950 text-sm font-black shrink-0">
                  {i + 1}
                </span>
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.paragraphs.map((p, pi) => (
                  <p key={pi} className="text-gray-300 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          ))}

          {author && (
            <blockquote className="bg-amber-500/5 border-l-2 border-amber-500 rounded-r-xl px-6 py-5">
              <Quote className="w-5 h-5 text-amber-500/50 mb-2" />
              <p className="text-gray-300 italic">"{author.quote}"</p>
              <p className="text-gray-500 text-sm mt-3">— {author.name}, {author.role}</p>
            </blockquote>
          )}
        </article>

        <div className="max-w-3xl mx-auto px-4 mt-16">
          {next ? (
            <Link
              to={`/blog/${next.slug}`}
              className="group flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition-all"
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">Up next</p>
                <p className="font-bold text-white group-hover:text-amber-300 transition-colors">{next.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </Link>
          ) : (
            <Link
              to="/blog"
              className="block text-center bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
            >
              Read more from the founders
            </Link>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
