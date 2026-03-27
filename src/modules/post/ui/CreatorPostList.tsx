import { PostCard } from "./PostCard"

type CreatorPostListItem = {
  id: string
  text: string
  createdAt: string
  isLocked: boolean
  previewText?: string
  mediaThumbnailUrls?: string[]
  previewThumbnailUrl?: string | null
}

type CreatorPostListProps = {
  posts: CreatorPostListItem[]
  isSubscribed: boolean
  unlockLabel?: string
  emptyMessage?: string
}

export function CreatorPostList({
  posts,
  isSubscribed,
  unlockLabel = "Subscribe to unlock",
  emptyMessage = "No posts yet.",
}: CreatorPostListProps) {
  if (posts.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
        {emptyMessage}
      </section>
    )
  }

  return (
    <section className="grid gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          postId={post.id}
          text={post.previewText ?? post.text}
          createdAt={post.createdAt}
          mediaThumbnailUrls={post.mediaThumbnailUrls}
          isLocked={post.isLocked && !isSubscribed}
        />
      ))}
    </section>
  )
}