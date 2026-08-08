/**
 * Speech helpers for the Seedwel branded video player.
 *
 * Every video opens with "Welcome to Seedwel Investment Limited, here is …"
 * and closes with "Thank you for watching". When a premium voiceover clip
 * exists (public/audio/intro-<id>.mp3, public/audio/outro.mp3) we play the
 * clip; otherwise we fall back to the browser's built-in speech synthesis so
 * EVERY video still gets the spoken intro/outro, on any device.
 */

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
  /** Cancel any ongoing speech before speaking. */
  interrupt?: boolean;
}

/** Pick the most natural-sounding English voice available. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = en.length ? en : voices;
  const preferred = ["google uk english female", "google us english", "samantha", "aria", "jenny", "zoira", "salli", "karen", "moira", "tessa", "female"];
  for (const name of preferred) {
    const found = pool.find((v) => v.name.toLowerCase().includes(name));
    if (found) return found;
  }
  return pool[0];
}

/** Cancel any speech currently playing. */
export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
}

/**
 * Speak `text`. Calls onEnd() when finished (or immediately when speech is
 * unavailable). Returns a cancel function.
 */
export function speak(text: string, opts: SpeakOptions = {}): () => void {
  const synth = window.speechSynthesis;
  if (!synth) {
    opts.onEnd?.();
    return () => {};
  }
  if (opts.interrupt) stopSpeaking();
  try {
    synth.resume();
  } catch {
    /* noop */
  }
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang || "en-US";
  utter.rate = opts.rate ?? 0.95;
  utter.pitch = opts.pitch ?? 1;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    opts.onEnd?.();
  };
  utter.onend = finish;
  utter.onerror = finish;
  // Safety net: some browsers never fire onend.
  const timeout = window.setTimeout(finish, Math.min(10000, Math.max(4000, text.length * 80)));
  synth.speak(utter);
  return () => {
    window.clearTimeout(timeout);
    try {
      synth.cancel();
    } catch {
      /* noop */
    }
  };
}

/** Warm up voice loading (Chrome loads voices lazily). */
export function warmUpVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.getVoices();
  } catch {
    /* noop */
  }
}
