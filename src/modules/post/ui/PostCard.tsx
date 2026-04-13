"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  HeartIcon as HeartOutline,
  ChatBubbleOvalLeftIcon,
} from "@heroicons/react/24/outline"
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid"

import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { ReportButton } from "@/modules/report/ui/ReportButton"

import { LockedPostCard } from "./LockedPostCard"
import { PostMoreMenu } from "./PostMoreMenu"

type MediaItem = {
  id?: string
  url: string
  type?: "image" | "video" | "audio" | "file"
}

type CommentItem = {
  id: string
  content: string
  created_at?: string
  user_id?: string
  likes_count?: number
  is_liked?: boolean
  profiles?:
    | {
        username?: string | null
        avatar_url?: string | null
      }
    | Array<{
        username?: string | null
        avatar_url?: string | null
      }>
    | null
}

type PostCardProps = {
  commentsCount?: number
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
  media?: MediaItem[]
  blocks?: {
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
  }[]
  isLocked?: boolean
  lockReason?: "none" | "subscription"
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  likesCount?: number
  isLiked?: boolean
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

function formatPostDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

export function PostCard({
  postId,
  text,
  createdAt,
  mediaThumbnailUrls = [],
  media = [],
  blocks = [],
  isLocked = false,
  lockReason = "none",
  creatorId,
  creatorUserId,
  currentUserId,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  creator,
}: PostCardProps) {
  const router = useRouter()
  const pathname = usePathname()

  const [liked, setLiked] = useState(isLiked)
  const [count, setCount] = useState(likesCount)
  const [isLikeLoading, setIsLikeLoading] = useState(false)

  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [isCommentsLoading, setIsCommentsLoading] = useState(false)
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const resolvedMedia =
    media.length > 0
      ? media
      : mediaThumbnailUrls.map((url, index) => ({
          id: `fallback-${index}`,
          url,
          type: "image" as const,
        }))

  const hasBlocks = blocks.length > 0

  const blockText = hasBlocks
    ? blocks
        .filter((block) => block.type === "text" && block.content?.trim())
        .map((block) => block.content?.trim() ?? "")
        .join("\n\n")
    : text

  const blockMedia =
    hasBlocks && resolvedMedia.length > 0
      ? blocks
          .filter(
            (block) =>
              block.type !== "text" &&
              block.mediaId &&
              resolvedMedia.some((item) => item.id === block.mediaId)
          )
          .map((block) => resolvedMedia.find((item) => item.id === block.mediaId))
          .filter((item): item is MediaItem => Boolean(item))
      : resolvedMedia

  const creatorName = creator.displayName ?? creator.username
  const creatorInitial = creatorName.slice(0, 1).toUpperCase()

  const primaryVideo = blockMedia.find((item) => item.type === "video")
  const visibleComments = expandedComments ? comments : comments.slice(0, 3)

  type RenderGroup =
    | {
        type: "text"
        block: NonNullable<PostCardProps["blocks"]>[number]
      }
    | {
        type: "media"
        blocks: NonNullable<PostCardProps["blocks"]>
        mediaItems: MediaItem[]
      }

  const groupedBlocks: RenderGroup[] = []

  if (hasBlocks) {
    let currentMediaBlocks: NonNullable<PostCardProps["blocks"]> = []
    let currentMediaItems: MediaItem[] = []

    const pushMediaGroup = () => {
      if (currentMediaBlocks.length === 0) return

      groupedBlocks.push({
        type: "media",
        blocks: currentMediaBlocks,
        mediaItems: currentMediaItems,
      })

      currentMediaBlocks = []
      currentMediaItems = []
    }

    for (const block of blocks) {
      if (block.type === "text") {
        pushMediaGroup()

        groupedBlocks.push({
          type: "text",
          block,
        })

        continue
      }

      const mediaItem = block.mediaId
        ? blockMedia.find((item) => item.id === block.mediaId)
        : undefined

      currentMediaBlocks.push(block)

      if (mediaItem) {
        currentMediaItems.push(mediaItem)
      }
    }

    pushMediaGroup()
  }

  async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    if (!postId || isLikeLoading) return

    try {
      setIsLikeLoading(true)

      const response = await fetch(`/api/post/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
      })

      if (!response.ok) {
        return
      }

      setLiked((prev) => !prev)
      setCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1))
    } catch {
      return
    } finally {
      setIsLikeLoading(false)
    }
  }

  async function loadComments() {
    if (!postId || isLocked) return

    try {
      setIsCommentsLoading(true)

      const response = await fetch(`/api/post/${postId}/comments`, {
        method: "GET",
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setComments(data.items ?? [])
    } catch {
      return
    } finally {
      setIsCommentsLoading(false)
    }
  }

  async function handleCommentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()

    const content = commentInput.trim()

    if (!postId || !content || isCommentSubmitting) return

    try {
      setIsCommentSubmitting(true)

      const response = await fetch(`/api/post/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        setCommentError(
          "부적절한 텍스트가 포함되어 있어 메시지를 보낼 수 없습니다."
        )
        return
      }

      setCommentInput("")
      setCommentError(null)
      await loadComments()
    } catch {
      return
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  async function handleDeleteComment(
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string
  ) {
    event.stopPropagation()

    if (!commentId || deletingCommentId) return

    try {
      setDeletingCommentId(commentId)

      const response = await fetch(`/api/comment/${commentId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        return
      }

      await loadComments()
    } finally {
      setDeletingCommentId(null)
    }
  }

  async function handleLikeComment(
    event: React.MouseEvent<HTMLButtonElement>,
    commentId: string,
    likedByMe: boolean
  ) {
    event.stopPropagation()

    const response = await fetch(`/api/comment/${commentId}/like`, {
      method: likedByMe ? "DELETE" : "POST",
    })

    if (!response.ok) {
      return
    }

    await loadComments()
  }

  useEffect(() => {
    if (!showComments) {
      setExpandedComments(false)
    }
  }, [showComments])

  useEffect(() => {
    if (!primaryVideo || !videoRef.current) return

    const element = videoRef.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVideoVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6)
      },
      {
        threshold: [0.2, 0.6, 1],
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [primaryVideo])

  useEffect(() => {
    if (!videoRef.current) return

    const video = videoRef.current

    if (isVideoVisible) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isVideoVisible])

  function handleCardClick() {
    return
  }

  function renderSingleMedia(item: MediaItem, alt: string) {
    const mediaUrl = item.url?.trim() ?? ""
    if (!mediaUrl) return null

    if (item.type === "video") {
      return (
        <video
          ref={videoRef}
          src={mediaUrl}
          muted
          loop
          playsInline
          autoPlay
          onClick={(event) => {
            const video = event.currentTarget
            if (video.paused) video.play()
            else video.pause()
          }}
          preload="metadata"
          onLoadedData={() => setIsVideoReady(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            isVideoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      )
    }

    if (item.type === "audio") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <audio controls className="w-full">
            <source src={mediaUrl} />
          </audio>
        </div>
      )
    }

    if (item.type === "file") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-4">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Open file
          </a>
        </div>
      )
    }

    return (
      <img
        src={mediaUrl}
        alt={alt}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      />
    )
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scrollLeft = event.currentTarget.scrollLeft
    const width = event.currentTarget.clientWidth
    const index = Math.round(scrollLeft / width)
    setCurrentIndex(index)
  }

  function renderMedia(items: MediaItem[] = blockMedia) {
    if (items.length === 0) return null

    if (items.length === 1) {
      const item = items[0]

      return (
        <div className="overflow-hidden">
          <div className="aspect-[4/5] w-full overflow-hidden">
            {renderSingleMedia(item, "Post media")}
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        <div
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        >
          {items.map((item, index) => (
            <div
              key={`${item.id ?? item.url}-${index}`}
              className="min-w-full snap-center"
            >
              <div className="aspect-[4/5] w-full overflow-hidden">
                {renderSingleMedia(item, `Post media ${index + 1}`)}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {items.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full ${
                index === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  function renderLockedAction() {
    if (lockReason === "subscription") {
      return (
        <div onClick={(event) => event.stopPropagation()}>
          <SubscribeButton
            creatorId={creatorId}
            creatorUserId={creatorUserId}
            currentUserId={currentUserId}
            creatorUsername={creator.username}
            embedded
          />
        </div>
      )
    }

    return null
  }

  function getCommentUsername(comment: CommentItem) {
    if (Array.isArray(comment.profiles)) {
      return comment.profiles[0]?.username ?? "user"
    }

    return comment.profiles?.username ?? "user"
  }

  function handleCreatorClick(event: React.MouseEvent) {
    event.stopPropagation()
    router.push(`/creator/${creator.username}`)
  }

  const textGroups = groupedBlocks.filter(
    (group): group is Extract<RenderGroup, { type: "text" }> => group.type === "text"
  )

  const mediaGroups = groupedBlocks.filter(
    (group): group is Extract<RenderGroup, { type: "media" }> => group.type === "media"
  )

  return (
    <article onClick={handleCardClick} className="group w-full">
      <div className="flex items-center justify-between px-4">
        <button
          type="button"
          onClick={handleCreatorClick}
          className="flex items-center gap-3 text-left"
        >
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creatorName}
              className="flex h-11 w-11 items-center justify-center bg-zinc-800 text-sm font-semibold text-white"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {creatorInitial}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">
              {creatorName}
            </p>
          </div>
        </button>

        {postId ? (
          <div onClick={(event) => event.stopPropagation()}>
            <PostMoreMenu
              postId={postId}
              pathname={pathname}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </div>

      {isLocked ? (
        <div className="mt-2">
          <LockedPostCard
            previewText={blockText}
            createdAt={createdAt}
            previewThumbnailUrl={blockMedia[0]?.url ?? null}
            action={renderLockedAction()}
          />
        </div>
      ) : (
        <>
          {hasBlocks ? (
            <>
              {mediaGroups.map((group, index) => (
                <div key={`media-group-${index}`} className="mt-2 overflow-hidden">
                  {group.mediaItems.length > 0 ? (
                    renderMedia(group.mediaItems)
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center bg-zinc-900 text-sm text-zinc-500">
                      {group.blocks.some((block) => block.type === "video")
                        ? "Video is processing..."
                        : "Media not available"}
                    </div>
                  )}
                </div>
              ))}

              {textGroups.length > 0 ? (
                <div className="space-y-1 px-3 pt-3">
                  {textGroups.map((group) => (
                    <p
                      key={group.block.id}
                      className="whitespace-pre-wrap text-sm leading-6 text-white/80"
                    >
                      {group.block.content}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {blockMedia.length > 0 ? <div className="mt-2">{renderMedia()}</div> : null}

              {blockText ? (
                <div className="px-3 pt-3">
                  <p className="whitespace-pre-wrap text-base leading-7 text-white">
                    {blockText}
                  </p>
                </div>
              ) : null}
            </>
          )}

          <div className="flex items-center justify-between gap-3 px-3 pt-3">
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-300">{formatPostDate(createdAt)}</p>

              <button
                type="button"
                onClick={handleLike}
                disabled={isLikeLoading}
                className="inline-flex items-center gap-1 px-1 py-1 text-sm text-zinc-300 transition hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {liked ? (
                  <HeartSolid className="h-4 w-4 text-pink-500" />
                ) : (
                  <HeartOutline className="h-4 w-4" />
                )}
                <span>{count}</span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()

                  const nextShow = !showComments
                  setShowComments(nextShow)

                  if (nextShow && comments.length === 0) {
                    loadComments()
                  }
                }}
                className="inline-flex items-center gap-1 px-1 py-1 text-sm text-zinc-300 transition hover:text-white active:scale-95"
              >
                <ChatBubbleOvalLeftIcon className="h-4 w-4" />
                <span>{commentsCount || comments.length}</span>
              </button>
            </div>
          </div>

          {showComments ? (
            <div
              className="space-y-3 px-3 pt-3"
              onClick={(event) => event.stopPropagation()}
            >
              <form onSubmit={handleCommentSubmit}>
                <input
                  value={commentInput}
                  onChange={(event) => setCommentInput(event.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border-b border-zinc-800 bg-black px-0 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
                  disabled={isCommentSubmitting}
                />
              </form>

              {commentError ? (
                <p className="text-xs text-red-500">{commentError}</p>
              ) : null}

              {isCommentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="animate-pulse px-0 py-3">
                      <div className="mb-2 h-3 w-1/3 rounded bg-zinc-700" />
                      <div className="h-3 w-2/3 rounded bg-zinc-700" />
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-zinc-500">No comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {visibleComments.map((comment) => (
                    <div key={comment.id} className="bg-black px-1 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm leading-6 text-zinc-300">
                          <span className="mr-2 text-sm font-semibold text-white">
                            @{getCommentUsername(comment)}
                          </span>
                          {comment.content}
                        </p>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) =>
                              handleLikeComment(
                                event,
                                comment.id,
                                Boolean(comment.is_liked)
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-0 py-1 text-sm text-zinc-300 transition hover:text-white active:scale-95"
                          >
                            {comment.is_liked ? (
                              <HeartSolid className="h-4 w-4 text-pink-500" />
                            ) : (
                              <HeartOutline className="h-4 w-4" />
                            )}
                            <span>{comment.likes_count ?? 0}</span>
                          </button>

                          <div onClick={(event) => event.stopPropagation()}>
                            <ReportButton
                              targetType="comment"
                              targetId={comment.id}
                              pathname={`/post/${postId}`}
                              currentUserId={currentUserId}
                            />
                          </div>

                          {currentUserId && comment.user_id === currentUserId ? (
                            <button
                              type="button"
                              onClick={(event) =>
                                handleDeleteComment(event, comment.id)
                              }
                              disabled={deletingCommentId === comment.id}
                              className="px-0 py-1 text-sm font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingCommentId === comment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}

                  {comments.length > 3 ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setExpandedComments((prev) => !prev)
                      }}
                      className="text-sm text-zinc-400 hover:text-white"
                    >
                      {expandedComments
                        ? "Hide comments"
                        : `View ${comments.length - 3} more comments`}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </article>
  )
}