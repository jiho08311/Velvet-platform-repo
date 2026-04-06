import Link from "next/link"
import { redirect } from "next/navigation"
import { PostCard } from "@/modules/post/ui/PostCard"

import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { getPostById } from "@/modules/post/server/get-post-by-id"
import { deletePostAction } from "@/modules/post/server/delete-post-action"
import PostPurchaseButton from "@/modules/post/ui/PostPurchaseButton"
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

function renderUnlockedMedia(media: {
  id: string
  url: string
  type: "image" | "video" | "audio" | "file"
}) {
  const mediaUrl = media.url?.trim() ?? ""

  if (!mediaUrl) {
    return null
  }

  if (media.type === "video") {
    return (
      <video
        src={mediaUrl}
        controls
        playsInline
        className="w-full"
      />
    )
  }

  if (media.type === "audio") {
    return (
      <div className="flex min-h-[180px] items-center justify-center bg-zinc-900 p-6">
        <audio controls className="w-full">
          <source src={mediaUrl} />
        </audio>
      </div>
    )
  }

  if (media.type === "file") {
    return (
      <div className="flex min-h-[180px] items-center justify-center bg-zinc-900 p-6">
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-white transition hover:bg-zinc-800"
        >
          Open file
        </a>
      </div>
    )
  }

  return (
    <img
      src={mediaUrl}
      alt="Post media"
      className="w-full object-cover"
    />
  )
}

function renderLockedMedia(media: {
  id: string
  url: string
  type: "image" | "video" | "audio" | "file"
}) {
  const mediaUrl = media.url?.trim() ?? ""

  if (!mediaUrl) {
    return null
  }

  if (media.type === "video") {
    return (
      <video
        src={mediaUrl}
        muted
        playsInline
        className="h-full w-full object-cover opacity-40 blur-md"
      />
    )
  }

  if (media.type === "audio" || media.type === "file") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-sm text-zinc-500">
        Locked content
      </div>
    )
  }

  return (
    <img
      src={mediaUrl}
      alt="Locked post media"
      className="h-full w-full object-cover opacity-40 blur-md"
    />
  )
}

export default async function PostDetailPage({
  params,
}: PostDetailPageProps) {
  const { postId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}`)
  }

  const [post, myCreator] = await Promise.all([
    getPostById(postId, user.id),
    getCreatorByUserId(user.id),
  ])

  if (!post) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Post not found"
            description="This post does not exist or is no longer available."
            actionLabel="Back to search"
            actionHref="/search"
          />
        </div>
      </main>
    )
  }

  const isLocked = post.isLocked
  const lockReason = post.lockReason ?? "none"
  const isOwner = myCreator?.id === post.creatorId
  const shouldAutoReloadOnce = !isLocked && post.media.length === 0

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      {shouldAutoReloadOnce ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var key = "post-detail-autoreload:${post.id}";
                if (sessionStorage.getItem(key)) return;
                sessionStorage.setItem(key, "1");
                setTimeout(function () {
                  window.location.reload();
                }, 2000);
              })();
            `,
          }}
        />
      ) : null}

      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Link
          href="/search"
          className="inline-flex w-fit items-center rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
        >
          ← Back to search
        </Link>
{isOwner ? (
  <div className="flex justify-end gap-2">
    <Link
      href={`/post/${post.id}/edit`}
      className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
    >
      Edit
    </Link>

    <form action={deletePostAction.bind(null, post.id)}>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-full border border-red-900/60 bg-red-950/60 px-4 text-sm font-medium text-red-300 transition hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  </div>
) : null}
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70">
        

         {isLocked ? (
  // 🔒 기존 locked UI 그대로 유지 (건드리지 마)
  <div className="relative">
    {post.media.length > 0 ? (
      <div className="grid grid-cols-1 gap-px bg-zinc-950 sm:grid-cols-2">
        {post.media.map((media) => (
          <div
            key={media.id}
            className="relative overflow-hidden bg-zinc-900"
          >
            {renderLockedMedia(media)}
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
  </div>
) : (
  // ✅ 여기 핵심
  <PostCard
    postId={post.id}
    text={post.content ?? ""}
    createdAt={post.publishedAt ?? post.createdAt}
    media={post.media.map((m) => ({
      url: m.url,
      type: m.type,
    }))}
    isLocked={false}
  creator={{
  username: post.creator.username,
  displayName: post.creator.displayName,
  avatarUrl: null,
}}
    creatorId={post.creatorId}
    creatorUserId={post.creatorUserId}
    currentUserId={user.id}
    likesCount={post.likesCount}
    isLiked={false}
    
  />
)}
        </article>
      </div>
    </main>
  )
}