import type {
  Story,
  StoryReadResolution,
  StoryReadWriteEligibilityInput,
  StoryReadWriteEligibilityResolution,
  StorySeenUpdateInput,
  StorySeenUpdateResolution,
} from "../types"

/**
 * Story Read-State Policy (UI SOURCE OF TRUTH)
 *
 * This file defines how persisted read-state is interpreted.
 *
 * Rules:
 * 1. Latest story = last item in creator story list (sorted asc by createdAt)
 * 2. Latest readable story = latest story that is read-eligible for the viewer
 * 3. Read:
 *    latestReadableStoryId === lastSeenStoryId
 * 4. Unread:
 *    latestReadableStoryId !== lastSeenStoryId
 *
 * Viewer Seen Update:
 * - A story is marked seen when the viewer leaves the active story
 * - Supported triggers: forward navigation, viewer close
 * - Duplicate marking is prevented per storyId
 *
 * Important:
 * - DO NOT re-implement this logic in UI components
 * - All surfaces must consume this policy
 */

export function getLatestStory(stories: Story[]): Story | null {
  if (stories.length === 0) {
    return null
  }

  return stories[stories.length - 1] ?? null
}

export function getLatestStoryId(stories: Story[]): string | null {
  return getLatestStory(stories)?.id ?? null
}

function isExpired(expiresAt: string): boolean {
  const expiresAtTime = new Date(expiresAt).getTime()

  if (Number.isNaN(expiresAtTime)) {
    return true
  }

  return expiresAtTime <= Date.now()
}

export function isStoryReadEligible(story: Story): boolean {
  if (story.isDeleted) {
    return false
  }

  if (isExpired(story.expiresAt)) {
    return false
  }

  if (story.isLocked) {
    return false
  }

  return true
}

export function resolveStoryReadWriteEligibility(
  input: StoryReadWriteEligibilityInput
): StoryReadWriteEligibilityResolution {
  const story = input.story

  if (!story) {
    return {
      canPersist: false,
      validLastSeenStoryId: null,
      reason: "story_missing",
    }
  }

  if (story.creatorId !== input.creatorId || story.id !== input.storyId) {
    return {
      canPersist: false,
      validLastSeenStoryId: null,
      reason: "creator_mismatch",
    }
  }

  if (story.isDeleted) {
    return {
      canPersist: false,
      validLastSeenStoryId: null,
      reason: "story_deleted",
    }
  }

  if (isExpired(story.expiresAt)) {
    return {
      canPersist: false,
      validLastSeenStoryId: null,
      reason: "story_expired",
    }
  }

  if (story.isLocked) {
    return {
      canPersist: false,
      validLastSeenStoryId: null,
      reason: "story_locked",
    }
  }

  return {
    canPersist: true,
    validLastSeenStoryId: story.id,
    reason: "eligible",
  }
}

export function getLatestReadableStory(stories: Story[]): Story | null {
  for (let index = stories.length - 1; index >= 0; index -= 1) {
    const story = stories[index]

    if (story && isStoryReadEligible(story)) {
      return story
    }
  }

  return null
}

export function getLatestReadableStoryId(stories: Story[]): string | null {
  return getLatestReadableStory(stories)?.id ?? null
}

function hasUnreadReadableStory(params: {
  latestReadableStoryId: string | null
  lastSeenStoryId: string | null
}): boolean {
  if (!params.latestReadableStoryId) {
    return false
  }

  return params.latestReadableStoryId !== params.lastSeenStoryId
}

export function resolveCreatorStoryReadState(params: {
  creatorId: string
  stories: Story[]
  lastSeenStoryId?: string | null
}): StoryReadResolution {
  const latestStoryId = getLatestStoryId(params.stories)
  const latestReadableStoryId = getLatestReadableStoryId(params.stories)
  const lastSeenStoryId = params.lastSeenStoryId ?? null
  const hasUnseenStory = hasUnreadReadableStory({
    latestReadableStoryId,
    lastSeenStoryId,
  })

  return {
    creatorId: params.creatorId,
    latestStoryId,
    latestReadableStoryId,
    lastSeenStoryId,
    hasUnseenStory,
    isRead: !hasUnseenStory,
  }
}

export function resolveStorySeenUpdate(
  input: StorySeenUpdateInput
): StorySeenUpdateResolution {
  if (!input.storyId) {
    return {
      shouldMarkSeen: false,
    }
  }

  if (input.lastMarkedStoryId === input.storyId) {
    return {
      shouldMarkSeen: false,
    }
  }

  if (input.trigger !== "advance" && input.trigger !== "close") {
    return {
      shouldMarkSeen: false,
    }
  }

  return {
    shouldMarkSeen: true,
  }
}
