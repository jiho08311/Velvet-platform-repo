"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { DiscoveryPostLinkItem } from "../discovery-contract"
import {
  createPostLikeCompatibilityFields,
  readLikeInteractionResult,
} from "@/shared/lib/like-interaction-result"
import { buildCreatorMessageHref } from "@/modules/creator/public/creator-identity"
import { ExplorePostViewerOverlay } from "./ExplorePostViewerOverlay"
import {
  type ExplorePostViewerBlock,
  readDiscoveryPostViewerHasLiked,
} from "./explore-post-viewer-model"
import {
  ExplorePostGridEmptyState,
  ExplorePostGridTile,
} from "./ExplorePostGridTile"

type ExplorePostGridProps = {
  posts: DiscoveryPostLinkItem[]
}

export function ExplorePostGrid({ posts }: ExplorePostGridProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<DiscoveryPostLinkItem | null>(null)
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

  const viewerBlocks = useMemo<ExplorePostViewerBlock[]>(() => {
    const next: ExplorePostViewerBlock[] = []

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
      <ExplorePostGridEmptyState
        title="No explore posts yet"
        description="Public image posts will appear here."
      />
    )
  }

  async function handleLike(postId: string, initialLikesCount: number) {
    if (isLikeLoading) return

    const liked =
      likedPostIds[postId] ??
      (selected?.postId === postId
        ? readDiscoveryPostViewerHasLiked(selected)
        : false)
    const currentCount = likeCounts[postId] ?? initialLikesCount

    try {
      setIsLikeLoading(true)

      const response = await fetch(`/api/post/${postId}/like`, {
        method: liked ? "DELETE" : "POST",
      })

      if (!response.ok) {
        return
      }

      const data = readLikeInteractionResult(await response.json().catch(() => null))

      if (!data || data.targetType !== "post" || data.targetId !== postId) {
        return
      }

      setLikedPostIds((prev) => ({
        ...prev,
        [postId]: data.viewerHasLiked,
      }))

      setLikeCounts((prev) => ({
        ...prev,
        [postId]: data.likesCount,
      }))

      setSelected((prev) => {
        if (!prev || prev.postId !== postId) {
          return prev
        }

        return {
          ...prev,
          likesCount: data.likesCount,
          viewerHasLiked: data.viewerHasLiked,
          ...createPostLikeCompatibilityFields(data),
        }
      })
    } finally {
      setIsLikeLoading(false)
    }
  }

  function handleCommentCreated() {
    setSelected((prev) => {
      if (!prev) {
        return prev
      }

      // Post preview count only:
      // keep this separate from SearchExploreCommentsDrawer's loaded list count.
      return {
        ...prev,
        commentsCount: prev.commentsCount + 1,
      }
    })
  }

  function handleOpenPost(post: DiscoveryPostLinkItem) {
    setSelected(post)
    setIsViewerVisible(false)
    setIsCommentsOpen(false)
  }

  function handleCloseViewer() {
    setIsCommentsOpen(false)
    setIsViewerVisible(false)
    setTimeout(() => {
      setSelected(null)
    }, 180)
  }

  const selectedIsLiked = selected
    ? likedPostIds[selected.postId] ?? readDiscoveryPostViewerHasLiked(selected)
    : false
  const selectedLikesCount = selected
    ? likeCounts[selected.postId] ?? selected.likesCount
    : 0

  return (
    <>
      <section className="grid grid-cols-2 gap-1 md:grid-cols-3">
        {posts.map((post) => (
          <ExplorePostGridTile
            key={post.id}
            post={post}
            onOpen={handleOpenPost}
          />
        ))}
      </section>

      {selected ? (
        <ExplorePostViewerOverlay
          selected={selected}
          viewerBlocks={viewerBlocks}
          isViewerVisible={isViewerVisible}
          isLiked={selectedIsLiked}
          likesCount={selectedLikesCount}
          isLikeLoading={isLikeLoading}
          isCommentsOpen={isCommentsOpen}
          onClose={handleCloseViewer}
          onLike={() => handleLike(selected.postId, selected.likesCount)}
          onOpenComments={() => setIsCommentsOpen(true)}
          onMessage={() =>
            router.push(
              buildCreatorMessageHref({
                creatorUserId: selected.creatorUserId,
              })
            )
          }
          onCommentsClose={() => setIsCommentsOpen(false)}
          onCommentCreated={handleCommentCreated}
        />
      ) : null}
    </>
  )
}
