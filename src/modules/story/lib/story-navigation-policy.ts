// src/modules/story/lib/story-navigation-policy.ts

import type { Story } from "../types"

export type StoryNavigationResolution = {
  nextIndex: number | null
  shouldClose: boolean
  hasNext: boolean
}

/**
 * Story Navigation Policy (SOURCE OF TRUTH)
 *
 * Rules:
 * - next story가 있으면 이동
 * - next story가 없으면 close
 *
 * UI는 이 로직을 절대 직접 구현하면 안됨
 */
export function resolveNextStoryIndex(
  stories: Story[],
  currentIndex: number
): StoryNavigationResolution {
  if (!stories.length) {
    return {
      nextIndex: null,
      shouldClose: true,
      hasNext: false,
    }
  }

  const nextIndex = currentIndex + 1

  if (nextIndex >= stories.length) {
    return {
      nextIndex: null,
      shouldClose: true,
      hasNext: false,
    }
  }

  return {
    nextIndex,
    shouldClose: false,
    hasNext: true,
  }
}