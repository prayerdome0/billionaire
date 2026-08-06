import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Crown,
  GraduationCap,
  Loader2,
  Lock,
  PlayCircle,
  Trophy,
  UserPlus,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../lib/auth";
import {
  fetchLeaderboard,
  fetchLessons,
  fetchModules,
  fetchProgress,
  type LeaderboardEntry,
  type Lesson,
  type Module,
} from "../lib/api";
import { cn } from "../utils/cn";

const difficultyColor: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Advanced: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "All Levels": "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export default function LessonsPage() {
  const { user, sessionKind, loading: authLoading } = useAuth();
  const signedIn = !!user || sessionKind === "dev";

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    (async () => {
      try {
        const [l, m, board] = await Promise.all([fetchLessons(), fetchModules(), fetchLeaderboard()]);
        let prog: string[] = [];
        if (signedIn) {
          try {
            prog = await fetchProgress();
          } catch {
            prog = [];
          }
        }
        if (!mounted) return;
        setLessons(l);
        setModules(m);
        setCompleted(new Set(prog));
        setLeaderboard(board);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authLoading, signedIn]);

  const grouped = useMemo(
    () =>
      modules
        .map((mod) => ({
          mod,
          items: lessons.filter((l) => l.moduleId === mod.id).sort((a, b) => a.number - b.number),
        }))
        .filter((g) => g.items.length > 0),
    [lessons, modules]
  );

  const total = lessons.length;
  const done = completed.size;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <PageHeader
        eyebrow="Curriculum"
        title="The Complete"
        highlight="Billionaire Curriculum"
        description="28 in-depth lessons across 6 modules. Each lesson includes full written content, key takeaways, action steps, and a quiz — reserved for registered students, with progress saved to your account."
      >
        <div className="mt-10 max-w-xl mx-auto">
          {loading || authLoading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm py-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading curriculum…
            </div>
          ) : signedIn ? (
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-gray-300 text-sm font-semibold">
                  <Trophy className="w-4 h-4 text-amber-400" /> Your Progress
                </span>
                <span className="text-amber-400 font-bold">
                  {done}/{total} lessons · {pct}%
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-3">
                Progress is stored on your account (<code className="text-amber-500/80">/api/progress</code>) and
                follows you on every device.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-500/10 to-gray-900/80 border border-amber-500/30 rounded-2xl p-6 text-left">
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-white">Registration required for the course</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Create a free Seedwel student account to open lessons, take quizzes, track progress
                    and earn the certificate.
                  </p>
                  <Link
                    to="/auth?next=/lessons"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-bold px-5 py-2.5 text-xs hover:from-amber-400 hover:to-yellow-400 transition-all"
                  >
                    <UserPlus className="w-4 h-4" /> Create Free Account / Sign In
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageHeader>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-4 space-y-14">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="h-8 w-64 bg-gray-800 rounded-lg" />
                  <div className="h-32 bg-gray-800/60 rounded-2xl" />
                  <div className="h-32 bg-gray-800/60 rounded-2xl" />
                </div>
              ))
            : grouped.map(({ mod, items }) => {
                const modDone = items.filter((l) => completed.has(l.id)).length;
                return (
                  <div key={mod.id}>
                    <div className="flex items-center gap-4 mb-6">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-gray-950 font-black text-lg shrink-0",
                          mod.gradient
                        )}
                      >
                        {mod.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-2xl md:text-3xl font-black text-white">{mod.title}</h2>
                          {signedIn && (
                            <span className="text-xs text-gray-500 font-mono">
                              {modDone}/{items.length} complete
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{mod.tagline}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {items.map((lesson) => {
                        const isDone = completed.has(lesson.id);
                        return (
                          <Link
                            key={lesson.id}
                            to={signedIn ? `/lessons/${lesson.id}` : `/auth?next=${encodeURIComponent(`/lessons/${lesson.id}`)}`}
                            className={cn(
                              "group flex items-center gap-5 bg-gray-900/60 border rounded-2xl p-5 transition-all duration-300 hover:border-amber-500/40 hover:bg-gray-900/90",
                              isDone ? "border-emerald-500/30" : "border-gray-800"
                            )}
                          >
                            <div className="shrink-0">
                              {signedIn ? (
                                isDone ? (
                                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                                ) : (
                                  <Circle className="w-8 h-8 text-gray-700 group-hover:text-amber-400/60 transition-colors" />
                                )
                              ) : (
                                <Lock className="w-7 h-7 text-gray-700 group-hover:text-amber-400/60 transition-colors" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-mono text-gray-600">
                                  L{String(lesson.number).padStart(2, "0")}
                                </span>
                                <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                                  {lesson.title}
                                </h3>
                                <span className={cn("text-xs px-2.5 py-0.5 rounded-full border", difficultyColor[lesson.difficulty] ?? "text-gray-400")}>
                                  {lesson.difficulty}
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm mt-1 line-clamp-1">{lesson.summary}</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-4 shrink-0">
                              <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                <Clock className="w-3.5 h-3.5" /> {lesson.duration}
                              </span>
                              <span className="flex items-center gap-1.5 text-gray-500 text-xs">
                                <GraduationCap className="w-3.5 h-3.5" /> Quiz
                              </span>
                              <ArrowRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-900/60 border border-amber-500/20 rounded-3xl p-8 md:p-10 text-center">
              <PlayCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                Prefer watching to reading?
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                Every module pairs with curated video masterclasses from the world's best — playable right inside the platform.
              </p>
              <Link
                to="/videos"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105"
              >
                <BookOpen className="w-5 h-5" /> Watch the Videos
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-900/60 border border-amber-500/20 rounded-3xl p-8 md:p-10 text-center">
              <Award className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                {done === total && total > 0 ? "You've finished the course!" : "Earn your certificate"}
              </h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                {done === total && total > 0
                  ? "Complete all 28 lessons. Congratulations — claim your official certificate now."
                  : `Complete all ${total} lessons${signedIn ? ` (${total - done} remaining)` : ""} to unlock your official certificate of completion.`}
              </p>
              <Link
                to="/certificate"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all hover:scale-105"
              >
                <Award className="w-5 h-5" /> {done === total && total > 0 ? "Get Your Certificate" : "View Progress"}
              </Link>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-black text-white">Student Leaderboard</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Top registered students by completed lessons. Complete lessons to climb the ranks.
            </p>
            {leaderboard.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">
                No completions yet — be the first to finish a lesson and claim the top spot!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-4 bg-gray-950/50 border border-gray-800/60 rounded-xl px-5 py-3"
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0",
                        entry.rank === 1
                          ? "bg-gradient-to-br from-amber-400 to-yellow-600 text-gray-950"
                          : entry.rank <= 3
                            ? "bg-gray-700 text-amber-300"
                            : "bg-gray-800 text-gray-400"
                      )}
                    >
                      {entry.rank}
                    </span>
                    <span className="text-white font-semibold text-sm truncate">{entry.name || entry.clientId}</span>
                    <span className="ml-auto text-sm text-gray-400 shrink-0">
                      <span className="text-amber-400 font-bold">{entry.completed}</span> lessons
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
