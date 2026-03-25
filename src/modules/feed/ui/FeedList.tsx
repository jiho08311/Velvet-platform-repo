import { PostCard } from "@/modules/post/ui/PostCard"

type FeedListPost = {
  id: string
  postId?: string
  text: string
  createdAt: string
  mediaThumbnailUrls?: string[]
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
      <section className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
        <p className="text-sm font-medium text-zinc-500">{emptyMessage}</p>
      </section>
    )
  }

return (
  <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
    {posts.map((post) => (
      <PostCard
        key={post.id}
        postId={post.postId}
        text={post.text}
        createdAt={post.createdAt}
        mediaThumbnailUrls={post.mediaThumbnailUrls}
      />
    ))}
  </section>
) 
}