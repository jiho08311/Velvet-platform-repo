"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { ReportButton } from "@/modules/report/ui/ReportButton"

import { LockedPostCard } from "./LockedPostCard"

type MediaItem = {
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
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
  media?: MediaItem[]
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

function getPreviewTitle(text: string) {
  const normalized = text.trim()

  if (!normalized) {
    return "Untitled post"
  }

  const firstLine = normalized.split("\n").find((line) => line.trim().length > 0)

  if (!firstLine) {
    return "Untitled post"
  }

  return firstLine.length > 72 ? `${firstLine.slice(0, 72)}...` : firstLine
}

function getPreviewBody(text: string) {
  const normalized = text.trim()

  if (!normalized) {
    return ""
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length <= 1) {
    return normalized
  }

  return lines.slice(1).join(" ")
}

export function PostCard({
  postId,
  text,
  createdAt,
  mediaThumbnailUrls = [],
  media = [],
  isLocked = false,
  lockReason = "none",

  creatorId,
  creatorUserId,
  currentUserId,
  likesCount = 0,
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
  const [showComments, setShowComments] = useState(true)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isVideoVisible, setIsVideoVisible] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)

  const creatorName = creator.displayName ?? creator.username
  const creatorInitial = creatorName.slice(0, 1).toUpperCase()
  const previewTitle = getPreviewTitle(text)
  const previewBody = getPreviewBody(text)

  const resolvedMedia =
    media.length > 0
      ? media
      : mediaThumbnailUrls.map((url) => ({
          url,
          type: "image" as const,
        }))

  const primaryVideo = resolvedMedia.find((item) => item.type === "video")

  const visibleComments = expandedComments ? comments : comments.slice(0, 3)

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
    loadComments()
  }, [postId, isLocked])

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
    if (!videoRef.current || !primaryVideo) return

    if (isVideoVisible) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isVideoVisible, primaryVideo])

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

  function renderMedia() {
    if (resolvedMedia.length === 0) return null

    if (resolvedMedia.length === 1) {
      const item = resolvedMedia[0]

      return (
        <div className="overflow-hidden rounded-2xl bg-zinc-950">
          <div className="aspect-[4/5] w-full overflow-hidden">
            {renderSingleMedia(item, "Post media")}
          </div>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-zinc-950">
        {resolvedMedia.slice(0, 2).map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="aspect-square overflow-hidden bg-zinc-900"
          >
            {renderSingleMedia(item, `Post media ${index + 1}`)}
          </div>
        ))}
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

  function handleCreatorClick(e: React.MouseEvent) {
    e.stopPropagation()
    router.push(`/creator/${creator.username}`)
  }

  return (
    <article
      onClick={handleCardClick}
      className="group overflow-hidden rounded-[32px] border border-zinc-800 bg-zinc-900/70 p-4 transition-all duration-200 hover:border-zinc-700 hover:shadow-xl sm:p-5"
    >
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleCreatorClick}
          className="flex items-center gap-3 text-left"
        >
          {creator.avatarUrl ? (
            <img
              src={creator.avatarUrl}
              alt={creatorName}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {creatorInitial}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {creatorName}
            </p>
          </div>
        </button>

        <div className="space-y-4">
          {isLocked ? (
            <LockedPostCard
              previewText={text}
              createdAt={createdAt}
              previewThumbnailUrl={resolvedMedia[0]?.url ?? null}
          
              action={renderLockedAction()}
            />
          ) : (
            <>
              <div className="space-y-2">
                <p className="line-clamp-2 text-base font-semibold leading-7 text-white sm:text-lg">
                  {previewTitle}
                </p>

                {previewBody ? (
                  <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                    {previewBody}
                  </p>
                ) : null}
              </div>

              {renderMedia()}

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-zinc-500">
                    {formatPostDate(createdAt)}
                  </p>

                  <button
                    type="button"
                    onClick={handleLike}
                    disabled={isLikeLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span aria-hidden="true">{liked ? "❤️" : "🤍"}</span>
                    <span>{count}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setShowComments((prev) => !prev)
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                  >
                    <span aria-hidden="true">💬</span>
                    <span>{comments.length}</span>
                  </button>
                </div>

                {postId ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ReportButton
                      targetType="post"
                      targetId={postId}
                      pathname={pathname}
                    />
                  </div>
                ) : null}
              </div>

              {showComments ? (
                <div
                  className="space-y-3 border-t border-zinc-800 pt-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <form onSubmit={handleCommentSubmit}>
                    <input
                      value={commentInput}
                      onChange={(event) => setCommentInput(event.target.value)}
                      placeholder="Write a comment..."
                      className="w-full rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
                      disabled={isCommentSubmitting}
                    />
                  </form>

                  {commentError ? (
                    <p className="text-xs text-red-500">{commentError}</p>
                  ) : null}

                  {isCommentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-3"
                        >
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
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3.5 py-3"
                        >
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
                                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
                              >
                                {comment.is_liked ? "❤️" : "🤍"}{" "}
                                {comment.likes_count ?? 0}
                              </button>

                              <div onClick={(event) => event.stopPropagation()}>
                                <ReportButton
                                  targetType="comment"
                                  targetId={comment.id}
                                  pathname={pathname}
                                  currentUserId={currentUserId}
                                />
                              </div>

                              {currentUserId &&
                              comment.user_id === currentUserId ? (
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleDeleteComment(event, comment.id)
                                  }
                                  disabled={deletingCommentId === comment.id}
                                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      </div>
    </article>
  )
}