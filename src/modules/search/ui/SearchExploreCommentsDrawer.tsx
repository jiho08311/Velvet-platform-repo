"use client"

import { useEffect, useMemo, useState } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

type CommentItem = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number
  is_liked: boolean
  profiles: {
    username: string | null
    avatar_url: string | null
  }
}

type SearchExploreCommentsDrawerProps = {
  postId: string | null
  isOpen: boolean
  onClose: () => void
  onCommentCreated?: () => void
}

export function SearchExploreCommentsDrawer({
  postId,
  isOpen,
  onClose,
  onCommentCreated,
}: SearchExploreCommentsDrawerProps) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDisabled = useMemo(() => {
    return isSubmitting || content.trim().length === 0 || !postId
  }, [content, isSubmitting, postId])

  async function fetchComments(targetPostId: string) {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/post/${targetPostId}/comments`, {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? "Failed to load comments")
        setComments([])
        return
      }

      setComments(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setError("Failed to load comments")
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !postId) {
      return
    }

    void fetchComments(postId)
  }, [isOpen, postId])

  async function handleSubmit() {
    if (isDisabled || !postId) {
      return
    }

    const nextContent = content.trim()

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/post/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: nextContent,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setError(data?.error ?? "Failed to create comment")
        return
      }

      setContent("")
      await fetchComments(postId)
      onCommentCreated?.()
    } catch {
      setError("Failed to create comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[80] transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-zinc-800 bg-zinc-950 transition duration-300 ease-out ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="relative flex items-center justify-center px-4 pb-3 pt-3">
            <div className="h-1.5 w-12 rounded-full bg-zinc-700" />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-zinc-800 px-4 pb-4">
            <p className="text-sm font-semibold text-white">Comments</p>
          </div>

          <div className="max-h-[55vh] overflow-y-auto px-4 py-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />
                <div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />
                <div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            ) : comments.length === 0 ? (
              <div className="rounded-2xl bg-zinc-900 px-4 py-6 text-center text-sm text-zinc-400">
                No comments yet
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => {
                  const username = comment.profiles?.username ?? "user"
                  const avatarInitial = username.slice(0, 1).toUpperCase()

                  return (
                    <div
                      key={comment.id}
                      className="flex gap-3 rounded-2xl bg-zinc-900 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-xs font-semibold text-white">
                        {comment.profiles?.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt={username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          avatarInitial
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white">
                          @{username}
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                          {comment.content}
                        </p>

                        <p className="mt-2 text-[11px] text-zinc-500">
                          Likes {comment.likes_count}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-end gap-3">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write a comment..."
                rows={1}
                className="min-h-[48px] flex-1 resize-none rounded-2xl bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
              />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="h-12 shrink-0 rounded-2xl bg-pink-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}