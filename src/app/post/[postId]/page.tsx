import Link from "next/link"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { EmptyState } from "@/shared/ui/EmptyState"
import { Card } from "@/shared/ui/Card"

type PostDetailPageProps = {
  params: Promise<{
    postId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function PostDetailPage({
  params,
}: PostDetailPageProps) {
  const { postId } = await params
  const post = await getPostById(postId)

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="Post not found"
            description="This post does not exist or is no longer available."
            actionLabel="Back to feed"
            actionHref="/feed"
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Link
          href="/feed"
          className="inline-flex w-fit items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white"
        >
          ← Back to feed
        </Link>

        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
            <span>•</span>
            <span className="capitalize">{post.visibility}</span>
          </div>

          {post.title ? (
            <h1 className="mt-4 text-3xl font-semibold text-white">{post.title}</h1>
          ) : null}

          <p className="mt-6 text-base leading-8 text-zinc-200">
            {post.content ?? ""}
          </p>

          <div className="mt-8 flex h-[360px] items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sm text-zinc-500">
            Media content placeholder
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
              Creator ID: {post.creatorId}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}