import { FeedEmptyState } from "./FeedEmptyState"
import { UpcomingCard } from "@/modules/feed/ui/UpcomingCard"
import { PostCard } from "@/modules/post/ui/PostCard"
import type { PostCardSurfaceProps } from "@/modules/post/ui/PostCard"
import {
  FEED_LIST_EMPTY_STATE,
  FEED_UPCOMING_STATE,
} from "./feed-surface-policy"

type FeedListPost = PostCardSurfaceProps & {
  id: string
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
}

type FeedListProps = {
  posts: FeedListPost[]
  emptyTitle?: string
  emptyMessage?: string
}

export function FeedList({
  posts,
  emptyTitle,
  emptyMessage,
}: FeedListProps) {
  if (posts.length === 0) {
    return (
      <FeedEmptyState
        title={emptyTitle ?? FEED_LIST_EMPTY_STATE.defaultTitle}
        description={emptyMessage ?? FEED_LIST_EMPTY_STATE.defaultDescription}
      />
    )
  }

  return (
    <section className="flex w-full flex-col gap-4">
      {posts.map((post) => {
        const isScheduled = post.status === "scheduled"

        if (isScheduled) {
          return (
            <UpcomingCard
              key={post.id}
              title={FEED_UPCOMING_STATE.defaultTitle}
              previewText={null}
              scheduledAt={post.publishedAt ?? ""}
              creator={post.creator}
            />
          )
        }

        return (
          <PostCard
            key={post.id}
            {...post}
          />
        )
      })}
    </section>
  )
}
