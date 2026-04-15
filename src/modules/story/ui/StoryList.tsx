"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import type { Story } from "../types"
import { EditStoryModal } from "./EditStoryModal"
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
  currentCreatorId?: string
}

function getInitial(value?: string | null) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return "C"
  return normalized.slice(0, 1).toUpperCase()
}

export function StoryList({
  stories,
  readStateMap = {},
  currentCreatorId,
}: StoryListProps) {
  const router = useRouter()

  const [selectedStories, setSelectedStories] = useState<Story[] | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [editingStories, setEditingStories] = useState<Story[] | null>(null)
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

  const myGroup = groups.find(
    (g) => currentCreatorId && g.creatorId === currentCreatorId
  )

  const otherGroups = groups.filter(
    (g) => !currentCreatorId || g.creatorId !== currentCreatorId
  )

  return (
    <>
      <section className="space-y-3">
        <div className="px-1">
          <h2 className="text-base font-semibold text-white">Stories</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-3 px-1 pb-2">


{/* 🔥 Drop (하드코딩 UI) */}
<button
  type="button"
  onClick={() => router.push("/drops")}
  className="flex shrink-0 flex-col items-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.04]"
>
  <div className="flex h-20 min-w-[72px] items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 px-3">
    <span className="text-xs font-semibold tracking-wide text-white">
      DROP
    </span>
  </div>

  <span className="text-xs font-medium text-white">
    Drops
  </span>
</button>

            <button
              type="button"
              onClick={() => router.push("/story/new")}
              className="flex shrink-0 flex-col items-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.04] animate-[storyIn_0.4s_ease-out]"
            >
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl text-white">
                  +
                </div>

                <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                  +
                </div>
              </div>

              <span className="text-xs font-medium text-white">
                Your Story
              </span>
            </button>

            {myGroup ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedStories(myGroup.stories)
                  setSelectedIndex(0)
                }}
                className="flex shrink-0 flex-col items-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.04] animate-[storyIn_0.4s_ease-out]"
              >
                <div className="relative">
                  <div className="rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 p-[2px]">
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-zinc-950">
                      {myGroup.creatorAvatarUrl ? (
                        <img
                          src={myGroup.creatorAvatarUrl}
                          alt={myGroup.creatorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-sm font-semibold text-white">
                          {getInitial(myGroup.creatorName)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      setEditingStories(myGroup.stories)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        event.stopPropagation()
                        setEditingStories(myGroup.stories)
                      }
                    }}
                    className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs text-white"
                    aria-label="Edit story"
                  >
                    ⋯
                  </div>
                </div>

                <span className="text-xs font-medium text-white">
                  Your Story
                </span>
              </button>
            ) : null}

            {otherGroups.map((group) => {
              const latestStory =
                group.stories[group.stories.length - 1] ?? null
              const lastSeenStoryId =
                localReadStateMap[group.creatorId] ?? null
              const hasUnseenStory =
                !!latestStory && latestStory.id !== lastSeenStoryId

              return (
                <button
                  key={group.creatorId}
                  type="button"
                  onClick={() => {
                    setSelectedStories(group.stories)
                    setSelectedIndex(0)
                  }}
                  className="flex shrink-0 flex-col items-center gap-2 transition-transform duration-300 ease-out hover:scale-[1.04] animate-[storyIn_0.4s_ease-out]"
                >
                  <div
                    className={
                      hasUnseenStory
                        ? "rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 p-[2px] animate-[storyPulse_2.5s_ease-in-out_infinite]"
                        : "rounded-full bg-zinc-700 p-[2px]"
                    }
                  >
                    <div className="h-20 w-20 overflow-hidden rounded-full bg-zinc-950">
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

                  <span className="max-w-[72px] truncate text-sm text-white">
                    {group.creatorName}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <EditStoryModal
        open={editingStories !== null}
        stories={editingStories ?? []}
        onClose={() => setEditingStories(null)}
      />

      <StoryViewer
        stories={selectedStories ?? []}
        initialIndex={selectedIndex}
        open={selectedStories !== null}
        onClose={() => setSelectedStories(null)}
        onSeenStories={async ({ creatorId, storyId }) => {
          await fetch("/api/story-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creatorId, storyId }),
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