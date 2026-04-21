"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"
import { SearchExploreCommentsDrawer } from "./SearchExploreCommentsDrawer"

type ExplorePostGridItem = {
  id: string
  postId: string
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
  mediaType?: "image" | "video"
  mediaCount?: number
  text: string | null
  likesCount: number
  commentsCount: number
  createdAt: string
  media?: Array<{
    id: string
    postId: string
    type: "image" | "video" | "audio" | "file"
    url: string
    mimeType: string | null
    sortOrder: number
  }>
  blocks?: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: unknown | null
  }>
}

type ExplorePostGridProps = {
  posts: ExplorePostGridItem[]
}

type ViewerBlock =
  | {
      kind: "text"
      id: string
      content: string
    }
  | {
      kind: "media"
      id: string
      items: Array<{
        id: string
        type: "image" | "video"
        url: string
      }>
    }

export function ExplorePostGrid({ posts }: ExplorePostGridProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<ExplorePostGridItem | null>(null)
  const [isViewerVisible, setIsViewerVisible] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)

  const selectedMediaMap = useMemo(() => {
    return new Map((selected?.media ?? []).map((item) => [item.id, item]))
  }, [selected])

  const selectedBlocks = useMemo(() => {
    if (!selected) {
      return []
    }

    const blocks = [...(selected.blocks ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder
    )

    if (blocks.length > 0) {
      return blocks
    }

    if (selected.text?.trim()) {
      return [
        {
          id: `${selected.postId}-fallback-text`,
          postId: selected.postId,
          type: "text" as const,
          content: selected.text,
          mediaId: null,
          sortOrder: 0,
          createdAt: selected.createdAt,
          editorState: null,
        },
      ]
    }

    return []
  }, [selected])

  const viewerBlocks = useMemo<ViewerBlock[]>(() => {
    const next: ViewerBlock[] = []

    for (const block of selectedBlocks) {
      if (block.type === "text") {
        const content = block.content?.trim() ?? ""

        if (content) {
          next.push({
            kind: "text",
            id: block.id,
            content,
          })
        }

        continue
      }

      if (block.type === "image" || block.type === "video") {
        const mediaItem = block.mediaId
          ? selectedMediaMap.get(block.mediaId)
          : null

        if (mediaItem?.url) {
          next.push({
            kind: "media",
            id: block.id,
            items: [
              {
                id: block.id,
                type: block.type,
                url: mediaItem.url,
              },
            ],
          })
        }
      }
    }

    return next
  }, [selectedBlocks, selectedMediaMap])

  useEffect(() => {
    if (!selected) return

    const timer = window.setTimeout(() => {
      setIsViewerVisible(true)
    }, 10)

    return () => window.clearTimeout(timer)
  }, [selected])

  if (posts.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-3xl bg-zinc-900 p-10 text-center">
        <div className="text-4xl">🖼️</div>

        <p className="mt-4 text-base font-semibold text-white">
          No explore posts yet
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Public image posts will appear here.
        </p>
      </section>
    )
  }

  async function handleLike(postId: string, initialLikesCount: number) {
    if (isLikeLoading) return

    const liked = likedPostIds[postId] ?? false
    const currentCount = likeCounts[postId] ?? initialLikesCount

    try {
      setIsLikeLoading(true)

      const response = await fetch(`/api/post/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
      })

      if (!response.ok) {
        return
      }

      setLikedPostIds((prev) => ({
        ...prev,
        [postId]: !liked,
      }))

      setLikeCounts((prev) => ({
        ...prev,
        [postId]: liked ? Math.max(0, currentCount - 1) : currentCount + 1,
      }))
    } finally {
      setIsLikeLoading(false)
    }
  }

  function handleCommentCreated() {
    setSelected((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        commentsCount: prev.commentsCount + 1,
      }
    })
  }

  return (
    <>
      <section className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => {
              setSelected(post)
              setIsViewerVisible(false)
              setIsCommentsOpen(false)
            }}
            className="group block cursor-pointer overflow-hidden bg-zinc-900"
          >
            <div className="relative aspect-square overflow-hidden bg-zinc-950">
              {post.mediaType === "video" ? (
                <video
                  src={post.imageUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={post.imageUrl}
                  alt={post.creatorDisplayName ?? post.creatorUsername}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                />
              )}

              {post.mediaCount && post.mediaCount > 1 ? (
                <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  +{post.mediaCount - 1}
                </div>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2">
                <p className="truncate text-xs font-medium text-white">
                  {post.creatorDisplayName ?? post.creatorUsername}
                </p>
                <p className="truncate text-[11px] text-zinc-300">
                  @{post.creatorUsername}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {selected ? (
        <div
          className={`fixed inset-0 z-[70] bg-black transition duration-200 ${
            isViewerVisible ? "bg-black/95" : "bg-black/0"
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setIsCommentsOpen(false)
              setIsViewerVisible(false)
              setTimeout(() => {
                setSelected(null)
              }, 180)
            }}
            className={`absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition duration-200 ${
              isViewerVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            <ArrowLeftIcon className="h-7 w-7" />
          </button>

          <div
            className={`h-full overflow-y-auto transition duration-300 ease-out ${
              isViewerVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="mx-auto flex min-h-full max-w-3xl flex-col bg-black px-4 pb-5 pt-20">
              <div className="space-y-4">
                {viewerBlocks.map((block) => {
                  if (block.kind === "text") {
                    return (
                      <p
                        key={block.id}
                        className="whitespace-pre-wrap text-sm leading-6 text-zinc-300"
                      >
                        {block.content}
                      </p>
                    )
                  }

                  const item = block.items[0]

                  if (!item) {
                    return null
                  }

                  return (
                    <div
                      key={block.id}
                      className="overflow-hidden rounded-2xl bg-zinc-950"
                    >
                      {item.type === "video" ? (
                        <video
                          src={item.url}
                          controls
                          playsInline
                          className="w-full"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={
                            selected.creatorDisplayName ??
                            selected.creatorUsername
                          }
                          className="w-full object-cover"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-4 text-zinc-200">
                  <button
                    type="button"
                    onClick={() =>
                      handleLike(selected.postId, selected.likesCount)
                    }
                    disabled={isLikeLoading}
                    className="flex items-center gap-1.5"
                  >
                    {likedPostIds[selected.postId] ? (
                      <HeartSolid className="h-6 w-6 text-pink-500" />
                    ) : (
                      <HeartOutline className="h-6 w-6 stroke-[2.2]" />
                    )}
                    <span className="text-sm font-semibold">
                      {likeCounts[selected.postId] ?? selected.likesCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCommentsOpen(true)}
                    className="flex items-center gap-1.5"
                  >
                    <ChatBubbleOvalLeftIcon className="h-6 w-6 stroke-[2.2]" />
                    <span className="text-sm font-semibold">
                      {selected.commentsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/messages?creatorId=${selected.creatorUserId}`)
                    }
                    className="flex items-center gap-1.5"
                  >
                    <PaperAirplaneIcon className="h-6 w-6 stroke-[2.2]" />
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">
                    {selected.creatorDisplayName ?? selected.creatorUsername}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <SearchExploreCommentsDrawer
            postId={selected.postId}
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
            onCommentCreated={handleCommentCreated}
          />
        </div>
      ) : null}
    </>
  )
}