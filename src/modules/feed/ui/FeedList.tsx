import { FeedEmptyState } from "./FeedEmptyState"
import { UpcomingCard } from "@/modules/feed/ui/UpcomingCard"
import { PostCard } from "@/modules/post/ui/PostCard"
import type { PostBlockEditorState } from "@/modules/post/types"
import {
  FEED_LIST_EMPTY_STATE,
  FEED_UPCOMING_STATE,
} from "./feed-surface-policy"

type FeedListPost = {
  id: string
  postId?: string
  creatorId: string
  creatorUserId?: string
  commentsCount?: number
  currentUserId?: string
  text: string
  createdAt: string
  media?: Array<{
    id?: string
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
  likesCount?: number
  isLiked?: boolean
  status?: "draft" | "scheduled" | "published" | "archived"
  publishedAt?: string | null
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
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
            postId={post.postId}
            text={post.text}
            createdAt={post.createdAt}
            media={post.media ?? []}
            blocks={post.blocks ?? []}
            isLocked={post.isLocked}
            commentsCount={post.commentsCount}
            likesCount={post.likesCount}
            isLiked={post.isLiked}
            creatorId={post.creatorId}
            creatorUserId={post.creatorUserId}
            currentUserId={post.currentUserId}
            creator={post.creator}
          />
        )
      })}
    </section>
  )
}