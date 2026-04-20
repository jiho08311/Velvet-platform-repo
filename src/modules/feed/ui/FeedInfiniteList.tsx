"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FeedList } from "./FeedList"
import { FeedListSkeleton } from "./FeedListSkeleton"
import type { PostBlockEditorState } from "@/modules/post/types"

type FeedInfiniteListPost = {
  id: string
  postId?: string
  creatorId: string
  creatorUserId?: string
  commentsCount?: number
  currentUserId?: string
  text: string
  createdAt: string
  media?: Array<{
    id: string
    url: string
    type: "image" | "video" | "audio" | "file"
  }>
  blocks?: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: PostBlockEditorState
  }>
  isLocked?: boolean
  lockReason?: "none" | "subscription" | "purchase"
  likesCount?: number
  isLiked?: boolean
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
  price?: number
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

type FeedInfiniteListProps = {
  initialPosts: FeedInfiniteListPost[]
  initialCursor: string | null
  currentUserId?: string
}

type FeedApiItem = {
  id: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  isLocked: boolean
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
  lockReason?: "none" | "subscription" | "purchase"
  price?: number
  media?: Array<{
    id: string
    url: string
    type: "image" | "video" | "audio" | "file"
  }>
  blocks?: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
    editorState: PostBlockEditorState
  }>
  likesCount: number
  isLiked: boolean
  commentsCount: number
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

function normalizePosts(
  items: FeedApiItem[],
  currentUserId?: string
): FeedInfiniteListPost[] {
  return items.map((item) => ({
    id: item.id,
    postId: item.id,
    creatorId: item.creatorId,
    creatorUserId: item.creatorUserId,
    currentUserId: currentUserId ?? item.currentUserId,
    text: item.text,
    createdAt: item.createdAt,
    status: item.status,
    publishedAt: item.publishedAt ?? null,
    media: item.media ?? [],
    blocks: item.blocks ?? [],
    isLocked: item.isLocked,
    lockReason: item.lockReason,
    price: item.price,
    commentsCount: item.commentsCount,
    likesCount: item.likesCount,
    isLiked: item.isLiked,
    creator: item.creator,
  }))
}

export function FeedInfiniteList({
  initialPosts,
  initialCursor,
  currentUserId,
}: FeedInfiniteListProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(Boolean(initialCursor))
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const postIds = useMemo(() => new Set(posts.map((post) => post.id)), [posts])

  useEffect(() => {
    if (!hasMore || isLoading) return

    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (isLoading) return
        if (!cursor) return

        try {
          setIsLoading(true)

          const response = await fetch(
            `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=10`,
            {
              method: "GET",
              cache: "no-store",
            }
          )

          if (!response.ok) {
            return
          }

          const data = await response.json()
          const nextItems = normalizePosts(data.items ?? [], currentUserId)

          setPosts((prev) => {
            const existingIds = new Set(prev.map((post) => post.id))
            const merged = [...prev]

            for (const item of nextItems) {
              if (!existingIds.has(item.id)) {
                merged.push(item)
              }
            }

            return merged
          })

          setCursor(data.nextCursor ?? null)
          setHasMore(Boolean(data.nextCursor))
        } finally {
          setIsLoading(false)
        }
      },
      {
        rootMargin: "600px 0px",
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [cursor, hasMore, isLoading, currentUserId])

  return (
    <>
      <FeedList posts={posts} />

      {hasMore ? <div ref={sentinelRef} className="h-1 w-full" /> : null}

      {isLoading ? <FeedListSkeleton count={2} /> : null}
    </>
  )
}