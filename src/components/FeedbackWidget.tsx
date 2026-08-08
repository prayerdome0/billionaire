import { useState } from "react";
import { CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { postFeedback } from "../lib/api";
import { cn } from "../utils/cn";

/**
 * Compact "Was this helpful?" widget — posts to POST /api/feedback
 * (public endpoint, shown to admins in the API + overview).
 */
export default function FeedbackWidget({ page = "/", compact = false }: { page?: string; compact?: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating && !comment.trim()) return;
    setStatus("sending");
    try {
      await postFeedback({ page, rating: rating || undefined, comment });
      setStatus("sent");
    } catch {
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold py-3">
        <CheckCircle2 className="w-4 h-4" /> Thank you for watching — feedback received!
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-3", compact ? "items-center" : "items-start")}>
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rate this video">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                (hover || rating) >= n ? "text-amber-400 fill-amber-400" : "text-gray-700 hover:text-gray-500"
              )}
            />
          </button>
        ))}
      </div>
      <div className="flex w-full max-w-sm gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Was this helpful? Tell us…"
          className="flex-1 min-w-0 bg-gray-900/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={status === "sending" || (!rating && !comment.trim())}
          className="shrink-0 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 text-amber-300 font-bold px-3.5 py-2 rounded-lg text-xs hover:bg-amber-500/20 transition-all disabled:opacity-40"
        >
          {status === "sending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send
        </button>
      </div>
    </form>
  );
}
