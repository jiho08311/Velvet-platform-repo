import { FeedEmptyState } from "./FeedEmptyState"
import { PostCard } from "@/modules/post/ui/PostCard"

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
    url: string
    type?: "image" | "video" | "audio" | "file"
  }>
  blocks?: Array<{
    id: string
    postId: string
    type: "text" | "image" | "video" | "audio" | "file"
    content: string | null
    mediaId: string | null
    sortOrder: number
    createdAt: string
  }>
  isLocked?: boolean
  likesCount?: number
  isLiked?: boolean
  creator: {
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

type FeedListProps = {
  posts: FeedListPost[]
  emptyMessage?: string
}

export function FeedList({
  posts,
  emptyMessage = "No posts in your feed yet.",
}: FeedListProps) {
  if (posts.length === 0) {
    return (
      <FeedEmptyState
        title="No feed yet"
        description={emptyMessage}
      />
    )
  }

  return (
    <section className="flex w-full flex-col gap-4">
      {posts.map((post) => (
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
      ))}
    </section>
  )
}