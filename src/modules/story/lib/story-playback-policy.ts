// src/modules/story/lib/story-playback-policy.ts

import type { Story } from "../types"

export type StoryPlaybackMode = "fixed" | "video"

export type StoryPlaybackPolicy = {
  mode: StoryPlaybackMode
  durationMs: number | null
}

/**
 * Story Playback Policy (SOURCE OF TRUTH)
 *
 * Rules:
 * - image → fixed timer
 * - locked → fixed timer
 * - video → runtime (no fixed duration)
 *
 * Important:
 * - UI must NOT re-implement these rules
 */
export function getStoryPlaybackPolicy(story: Story): StoryPlaybackPolicy {
  if (story.isLocked) {
    return {
      mode: "fixed",
      durationMs: 10000,
    }
  }

  if (story.mediaType === "image") {
    return {
      mode: "fixed",
      durationMs: 10000,
    }
  }

  if (story.mediaType === "video") {
    return {
      mode: "video",
      durationMs: null,
    }
  }

  return {
    mode: "fixed",
    durationMs: 10000,
  }
}