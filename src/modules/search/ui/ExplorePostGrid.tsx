import Link from "next/link"

type ExplorePostGridItem = {
  id: string
  postId: string
  creatorUsername: string
  creatorDisplayName: string | null
  imageUrl: string
}

type ExplorePostGridProps = {
  posts: ExplorePostGridItem[]
}

export function ExplorePostGrid({ posts }: ExplorePostGridProps) {
  if (posts.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
        <div className="text-4xl">🖼️</div>

        <p className="mt-4 text-base font-semibold text-white">
          No explore posts yet
        </p>

        <p className="mt-1 text-sm text-zinc-400">
          Public image posts will appear here.
        </p>
      </section>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.postId}`}
          className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70"
        >
          <div className="relative aspect-square overflow-hidden bg-zinc-950">
            <img
              src={post.imageUrl}
              alt={post.creatorDisplayName ?? post.creatorUsername}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
              <p className="truncate text-sm font-medium text-white">
                {post.creatorDisplayName ?? post.creatorUsername}
              </p>
              <p className="truncate text-xs text-zinc-300">
                @{post.creatorUsername}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  )
}