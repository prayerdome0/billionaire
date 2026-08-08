import type { SuccessStory } from "../data/content";
import type { VideoWithStats } from "./api";

/**
 * Convert a success story (photo + quote + video metadata) into a playable
 * branded video. The player id for story videos is `story-<id>` so the API
 * can attach view counts, watch history and related suggestions.
 */
export function storyToVideo(story: SuccessStory): VideoWithStats | null {
  const v = story.video;
  if (!v?.youtubeId) return null;
  return {
    id: `story-${story.id}`,
    kind: "success-story",
    person: story.name,
    title: v.title || `${story.name} — ${story.title}`,
    channel: v.channel || "Seedwel Investment Limited",
    description: `${story.name} — ${story.title}. ${story.encouragement}`,
    youtubeId: v.youtubeId,
    moduleId: "success-stories",
    duration: v.duration || "",
    level: "Inspiration",
    tags: story.tags || [],
    introAudio: v.introAudio || null,
    outroAudio: v.outroAudio || null,
  };
}

/** YouTube thumbnail for any video id. */
export function videoThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
