import { FeedEmptyState } from "./FeedEmptyState"
import { PostCard } from "@/modules/post/ui/PostCard"

type FeedListPost = {
  id: string
  postId?: string
  creatorId: string
  creatorUserId?: string
  currentUserId?: string
  text: string
  createdAt: string
  media?: Array<{
    url: string
    type?: "image" | "video" | "audio" | "file"
  }>
  isLocked?: boolean
  lockReason?: "none" | "subscription" | "purchase"
  price?: number
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
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          postId={post.postId}
          text={post.text}
          createdAt={post.createdAt}
          media={post.media ?? []}
          isLocked={post.isLocked}
          lockReason={post.lockReason}
          price={post.price}
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