import Link from "next/link"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { PostPurchaseButton } from "@/modules/post/ui/PostPurchaseButton"
import { EmptyState } from "@/shared/ui/EmptyState"

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
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}`)
  }

  const post = await getPostById(postId, user.id)

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
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

  const isLocked = post.isLocked
  const lockReason = post.lockReason ?? "none"

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link
          href="/feed"
          className="inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          ← Back to feed
        </Link>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
          <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 sm:text-sm">
              <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{post.visibility}</span>
            </div>

            {post.title ? (
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {post.title}
              </h1>
            ) : null}
          </div>

          {isLocked ? (
            <div className="relative">
              {post.media.length > 0 ? (
                <div className="grid grid-cols-1 gap-px bg-zinc-950 sm:grid-cols-2">
                  {post.media.map((media) => (
                    <div
                      key={media.id}
                      className="relative overflow-hidden bg-zinc-900"
                    >
                      <img
                        src={media.url}
                        alt="Locked post media"
                        className="h-full w-full object-cover opacity-40 blur-md"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-zinc-900 text-sm text-zinc-500">
                  Locked content
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    🔒 Locked
                  </div>

                  <p className="text-sm font-medium text-white">
                    This content is locked
                  </p>

                  {lockReason === "subscription" ? (
                    <SubscribeButton
                      creatorId={post.creatorId}
                      creatorUserId={post.creatorUserId}
                      currentUserId={user.id}
                    />
                  ) : (
                    <PostPurchaseButton postId={post.id} />
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-800 px-5 py-5 sm:px-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-500 sm:text-base sm:leading-8">
                  Locked post
                </p>
              </div>
            </div>
          ) : (
            <>
             {post.media.length > 0 ? (
  post.media.length === 1 ? (
    <div className="bg-zinc-950">
      <div className="relative overflow-hidden bg-zinc-900">
        <img
          src={post.media[0].url}
          alt="Post media"
          className="w-full object-cover"
        />
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-px bg-zinc-950 sm:grid-cols-2">
      {post.media.map((media) => (
        <div
          key={media.id}
          className="relative overflow-hidden bg-zinc-900"
        >
          <img
            src={media.url}
            alt="Post media"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
) : (
                  
                <div className="flex h-[360px] items-center justify-center bg-zinc-900 text-sm text-zinc-500">
                  No media
                </div>
              )}

              <div className="px-5 py-5 sm:px-6">
                <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-200 sm:text-base sm:leading-8">
                  {post.content ?? ""}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-400 sm:text-sm">
                    Creator ID: {post.creatorId}
                  </div>
                </div>
              </div>
            </>
          )}
        </article>
      </div>
    </main>
  )
}