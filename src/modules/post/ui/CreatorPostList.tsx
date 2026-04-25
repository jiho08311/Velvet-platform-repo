import { EmptyState } from "@/shared/ui/EmptyState"
import { CREATOR_SURFACE_EMPTY_STATE } from "@/modules/creator/ui/creator-surface-policy"
import { PostCard } from "./PostCard"
import type { PostCardCreator } from "./PostCard"

type CreatorPostListItem = {
  id: string
  content: string | null
  createdAt: string
  isLocked: boolean
  previewText?: string
  mediaThumbnailUrls?: string[]
  creatorId?: string
  creatorUserId?: string
  currentUserId?: string
  creator?: PostCardCreator
}

type CreatorPostListProps = {
  posts: CreatorPostListItem[]
  isSubscribed: boolean
  unlockLabel?: string
  emptyMessage?: string
}

export function CreatorPostList({
  posts,
  isSubscribed: _isSubscribed,
  unlockLabel: _unlockLabel = "Subscribe to unlock",
  emptyMessage = "No posts yet.",
}: CreatorPostListProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title={CREATOR_SURFACE_EMPTY_STATE.postsTab.title}
        description={
          emptyMessage || CREATOR_SURFACE_EMPTY_STATE.postsTab.description
        }
      />
    )
  }

  return (
    <section className="grid gap-4">
      {posts.map((post) => {
        const resolvedCreator =
          post.creator ?? {
            username: "creator",
            displayName: null,
            avatarUrl: null,
          }

        return (
          <PostCard
            key={post.id}
            postId={post.id}
            text={post.content ?? ""}
            createdAt={post.createdAt}
            isLocked={post.isLocked}
            creatorId={post.creatorId ?? ""}
            creatorUserId={post.creatorUserId}
            currentUserId={post.currentUserId}
            creator={resolvedCreator}
          />
        )
      })}
    </section>
  )
}