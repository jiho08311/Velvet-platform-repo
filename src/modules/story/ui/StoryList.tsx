"use client"

import { useEffect, useMemo, useState } from "react"

import type { Story } from "../types"
import { StoryViewer } from "./StoryViewer"

type StoryGroup = {
  creatorId: string
  creatorName: string
  creatorAvatarUrl: string | null
  stories: Story[]
}

type StoryListProps = {
  stories: Story[]
  readStateMap?: Record<string, string>
}

function getInitial(value?: string | null) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return "C"
  return normalized.slice(0, 1).toUpperCase()
}

export function StoryList({
  stories,
  readStateMap = {},
}: StoryListProps) {
  const [selectedStories, setSelectedStories] = useState<Story[] | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [localReadStateMap, setLocalReadStateMap] =
    useState<Record<string, string>>(readStateMap)

  useEffect(() => {
    setLocalReadStateMap(readStateMap)
  }, [readStateMap])

  const groups = useMemo<StoryGroup[]>(() => {
    const map = new Map<string, StoryGroup>()

    for (const story of stories) {
      const creatorId = story.creatorId
      const creatorName =
        story.creator?.displayName ?? story.creator?.username ?? "creator"
      const creatorAvatarUrl = story.creator?.avatarUrl ?? null

      const existing = map.get(creatorId)

      if (existing) {
        existing.stories.push(story)
        continue
      }

      map.set(creatorId, {
        creatorId,
        creatorName,
        creatorAvatarUrl,
        stories: [story],
      })
    }

    return Array.from(map.values())
  }, [stories])

  if (groups.length === 0) {
    return null
  }

  return (
    <>
      <section className="overflow-x-auto">
        <div className="flex gap-3 px-1 pb-2">
          {groups.map((group) => {
           const latestStory = group.stories[group.stories.length - 1] ?? null
            const lastSeenStoryId = localReadStateMap[group.creatorId] ?? null
            const hasUnseenStory =
              !!latestStory && latestStory.id !== lastSeenStoryId

            return (
              <button
                key={group.creatorId}
                type="button"
         onClick={() => {
  const stories = group.stories
  const lastSeenId = localReadStateMap[group.creatorId] ?? null

  let startIndex = 0

  if (lastSeenId) {
    const index = stories.findIndex((s) => s.id === lastSeenId)

    if (index !== -1) {
      const nextIndex = index + 1

      // unread가 있으면 다음 스토리부터
      if (nextIndex < stories.length) {
        startIndex = nextIndex
      } else {
        // 다 본 상태면 처음부터
        startIndex = 0
      }
    }
  }

  setSelectedStories(stories)
  setSelectedIndex(startIndex)
}}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <div
                  className={
                    hasUnseenStory
                      ? "rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 p-[2px]"
                      : "rounded-full bg-zinc-700 p-[2px]"
                  }
                >
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-950">
                    {group.creatorAvatarUrl ? (
                      <img
                        src={group.creatorAvatarUrl}
                        alt={group.creatorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-sm font-semibold text-white">
                        {getInitial(group.creatorName)}
                      </div>
                    )}
                  </div>
                </div>

                <span className="max-w-[72px] truncate text-xs text-zinc-300">
                  {group.creatorName}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <StoryViewer
        stories={selectedStories ?? []}
        initialIndex={selectedIndex}
        open={selectedStories !== null}
        onClose={() => setSelectedStories(null)}
        onSeenStories={async ({ creatorId, storyId }) => {
          await fetch("/api/story-read", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              creatorId,
              storyId,
            }),
          })

          setLocalReadStateMap((prev) => ({
            ...prev,
            [creatorId]: storyId,
          }))
        }}
      />
    </>
  )
}