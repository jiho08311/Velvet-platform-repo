import type {
  Story,
  StoryReadResolution,
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
 * 2. Read:
 *    latestStoryId === lastSeenStoryId
 * 3. Unread:
 *    latestStoryId !== lastSeenStoryId
 *
 * Viewer Seen Update:
 * - A story is marked seen when navigation progresses forward
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

export function resolveCreatorStoryReadState(params: {
  creatorId: string
  stories: Story[]
  lastSeenStoryId?: string | null
}): StoryReadResolution {
  const latestStoryId = getLatestStoryId(params.stories)
  const lastSeenStoryId = params.lastSeenStoryId ?? null
  const hasUnseenStory =
    !!latestStoryId && latestStoryId !== lastSeenStoryId

  return {
    creatorId: params.creatorId,
    latestStoryId,
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

  return {
    shouldMarkSeen: true,
  }
}