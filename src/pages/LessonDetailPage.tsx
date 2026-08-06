import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  Send,
  Trophy,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../lib/auth";
import {
  fetchComments,
  fetchLesson,
  fetchLessons,
  fetchProgress,
  markLessonComplete,
  postComment,
  type Comment,
} from "../lib/api";
import { getModule, type Lesson, type Module } from "../data/content";
import { cn } from "../utils/cn";

const difficultyColor: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Advanced: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "All Levels": "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

function Comments({ lessonId }: { lessonId: string }) {
  const { user, profile } = useAuth();
  const displayName = profile?.name || user?.displayName || (user?.email || "Student").split("@")[0];
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    fetchComments(lessonId).then((c) => mounted && setComments(c));
    return () => {
      mounted = false;
    };
  }, [lessonId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const created = await postComment({ lessonId, name: displayName, text: text.trim() });
      setComments((prev) => [created, ...prev]);
      setText("");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    }
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-white">Discussion ({comments.length})</h3>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Ask questions, share takeaways, and learn from other registered students. You are posting as{" "}
        <span className="text-amber-400 font-semibold">{displayName}</span>.
      </p>

      <form onSubmit={submit} className="mb-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Share your takeaway or question as ${displayName}...`}
          required
          rows={3}
          maxLength={2000}
          className="w-full bg-gray-950/70 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
        />
        {status === "error" && <p className="text-rose-400 text-sm mt-2">{error}</p>}
        <button
          type="submit"
          disabled={status === "sending" || !text.trim()}
          className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40"
        >
          {status === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {status === "sent" ? "Posted!" : "Post Comment"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-4">No comments yet — start the discussion!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="bg-gray-950/50 border border-gray-800/60 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-black">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-semibold text-white text-sm">{c.name}</span>
                </span>
                <span className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Quiz({ lesson, onPass }: { lesson: Lesson; onPass: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const score = useMemo(
    () => lesson.quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0),
    [answers, lesson.quiz]
  );
  const passed = score / lesson.quiz.length >= 0.7;

  const submit = () => {
    setSubmitted(true);
    setShowResults(true);
    if (passed) onPass();
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-bold text-white">Knowledge Check</h3>
      </div>

      <div className="space-y-8">
        {lesson.quiz.map((q, qi) => {
          const chosen = answers[qi];
          const isCorrect = chosen === q.answer;
          return (
            <div key={qi}>
              <p className="font-semibold text-white mb-4">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = chosen === oi;
                  const showCorrect = showResults && oi === q.answer;
                  const showWrong = showResults && selected && !isCorrect;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                        showCorrect
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                          : showWrong
                          ? "border-rose-500/60 bg-rose-500/10 text-rose-300"
                          : selected
                          ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                          : "border-gray-800 bg-gray-950/50 text-gray-300 hover:border-amber-500/30"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold", selected || showCorrect || showWrong ? "border-current" : "border-gray-700")}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                        {showCorrect && <Check className="w-4 h-4 ml-auto" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {showResults && (
                <p className={cn("text-xs mt-3", isCorrect ? "text-emerald-400" : "text-gray-400")}>
                  {isCorrect ? "Correct! " : "Not quite. "}
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length !== lesson.quiz.length}
          className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40"
        >
          <Trophy className="w-4 h-4" /> Submit Quiz
        </button>
      ) : (
        <div
          className={cn(
            "mt-8 flex items-center gap-4 rounded-xl border p-5",
            passed ? "border-emerald-500/40 bg-emerald-500/10" : "border-amber-500/40 bg-amber-500/10"
          )}
        >
          {passed ? (
            <>
              <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-emerald-300">
                  Passed! {score}/{lesson.quiz.length} correct
                </p>
                <p className="text-sm text-emerald-400/80">Lesson marked complete — nice work.</p>
              </div>
            </>
          ) : (
            <>
              <Circle className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-amber-300">
                  {score}/{lesson.quiz.length} correct — keep going
                </p>
                <p className="text-sm text-amber-400/80">
                  Review the lesson and retake the quiz to lock in the concepts.
                </p>
                <button
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                    setShowResults(false);
                  }}
                  className="text-sm text-amber-400 underline mt-2"
                >
                  Retake quiz
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const prog = await fetchProgress().catch(() => [] as string[]);
        const [l, all] = await Promise.all([fetchLesson(id!), fetchLessons()]);
        if (!mounted) return;
        setLesson(l);
        setAllLessons(all);
        setCompleted(new Set(prog));
      } catch {
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const module: Module | undefined = lesson ? getModule(lesson.moduleId) : undefined;

  const siblings = useMemo(() => {
    if (!lesson) return { prev: null as Lesson | null, next: null as Lesson | null };
    const inModule = allLessons.filter((l) => l.moduleId === lesson.moduleId).sort((a, b) => a.number - b.number);
    const idx = inModule.findIndex((l) => l.id === lesson.id);
    return {
      prev: idx > 0 ? inModule[idx - 1] : null,
      next: idx >= 0 && idx < inModule.length - 1 ? inModule[idx + 1] : null,
    };
  }, [lesson, allLessons]);

  const isDone = lesson ? completed.has(lesson.id) : false;

  const toggleComplete = async () => {
    if (!lesson) return;
    const next = new Set(completed);
    if (next.has(lesson.id)) next.delete(lesson.id);
    else next.add(lesson.id);
    setCompleted(next);
    try {
      await markLessonComplete(lesson.id, next.has(lesson.id));
    } catch {
      // API offline — keep local state; it will resync next visit
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (notFound || !lesson) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-3xl font-black text-white mb-3">Lesson not found</h1>
          <p className="text-gray-500 mb-8">The lesson you're looking for doesn't exist (yet).</p>
          <Link to="/lessons" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl">
            Back to Lessons
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      {/* Header */}
      <header className="relative pt-32 pb-10 overflow-hidden">
        <div className="absolute inset-0">
          <div
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-br opacity-5 rounded-full blur-3xl",
              module?.gradient ?? "from-amber-400 to-yellow-600"
            )}
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <Link to="/lessons" className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-400 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All lessons
          </Link>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className={cn("text-xs px-3 py-1 rounded-full border font-mono", difficultyColor[lesson.difficulty] ?? "text-gray-400")}>
              {lesson.difficulty}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" /> {lesson.duration}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <BookOpen className="w-3.5 h-3.5" /> Module {module?.number}: {module?.title}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
            {lesson.title}
          </h1>
          <p className="text-amber-400/90 font-medium mb-4">{lesson.subtitle}</p>
          <p className="text-gray-400 max-w-2xl leading-relaxed">{lesson.summary}</p>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={toggleComplete}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                isDone
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 hover:from-amber-400 hover:to-yellow-400"
              )}
            >
              {isDone ? <><CheckCircle className="w-4 h-4" /> Completed — click to undo</> : <><Check className="w-4 h-4" /> Mark as Complete</>}
            </button>
            <span className="text-xs text-gray-600">
              Saved to the database via <code className="text-amber-500/70">POST /api/progress</code>
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="pb-24">
        <div className="max-w-4xl mx-auto px-4 grid lg:grid-cols-[1fr_300px] gap-10">
          <div className="space-y-12">
            {lesson.content.map((section, i) => (
              <div key={i}>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-gray-950 text-sm font-black shrink-0", module?.gradient ?? "from-amber-400 to-yellow-600")}>
                    {i + 1}
                  </span>
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, pi) => (
                    <p key={pi} className="text-gray-300 leading-relaxed">{p}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-3 text-gray-400 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Takeaways */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8">
              <h3 className="flex items-center gap-3 text-xl font-bold text-white mb-5">
                <Lightbulb className="w-6 h-6 text-amber-400" /> Key Takeaways
              </h3>
              <ul className="space-y-3">
                {lesson.takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action steps */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8">
              <h3 className="flex items-center gap-3 text-xl font-bold text-white mb-5">
                <ListChecks className="w-6 h-6 text-emerald-400" /> Your Action Steps
              </h3>
              <ol className="space-y-3">
                {lesson.actionSteps.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    {a}
                  </li>
                ))}
              </ol>
            </div>

            {/* Quiz */}
            <Quiz
              lesson={lesson}
              onPass={() => {
                if (!completed.has(lesson.id)) {
                  setCompleted((prev) => new Set(prev).add(lesson.id));
                  markLessonComplete(lesson.id, true).catch(() => {});
                }
              }}
            />

            {/* Comments */}
            <Comments lessonId={lesson.id} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
                Module {module?.number} · {module?.title}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{module?.description}</p>
              <div className="flex items-center justify-between text-sm">
                {siblings.prev ? (
                  <Link to={`/lessons/${siblings.prev.id}`} className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Link>
                ) : (
                  <span />
                )}
                {siblings.next ? (
                  <Link to={`/lessons/${siblings.next.id}`} className="flex items-center gap-1.5 text-gray-400 hover:text-amber-400 transition-colors">
                    Next <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">Lesson Info</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Duration</dt><dd className="text-gray-300">{lesson.duration}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Difficulty</dt><dd className="text-gray-300">{lesson.difficulty}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Sections</dt><dd className="text-gray-300">{lesson.content.length}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Quiz</dt><dd className="text-gray-300">{lesson.quiz.length} questions</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className={isDone ? "text-emerald-400" : "text-gray-300"}>{isDone ? "Completed" : "In progress"}</dd></div>
              </dl>
            </div>
            <Link
              to="/videos"
              className="flex items-center justify-center gap-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-sm text-gray-300 hover:border-amber-500/30 hover:text-amber-400 transition-all"
            >
              <ArrowRight className="w-4 h-4" /> Watch videos for this module
            </Link>
          </aside>
        </div>
      </section>
      <Footer />
    </div>
  );
}
