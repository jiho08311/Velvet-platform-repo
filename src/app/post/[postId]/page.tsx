import Link from "next/link"
import { redirect } from "next/navigation"
import { PostCard } from "@/modules/post/ui/PostCard"
import { LockedPostCard } from "@/modules/post/ui/LockedPostCard"
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
     <main className="min-h-screen bg-zinc-950 px-0 py-8 text-white sm:px-6 sm:py-10">
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

  const detailCardMedia = post.media.map((media) => ({
    id: media.id,
    url: media.url,
    type: media.type,
  }))

  const detailCardBlocks = post.blocks ?? []

  const detailCardText = post.content ?? ""

  const detailCreator = {
    username: post.creator.username,
    displayName: post.creator.displayName,
    avatarUrl: null,
  }

const lockedPreviewMedia = post.media[0] ?? null
const hasLockedMedia = Boolean(lockedPreviewMedia)
const lockedPreviewThumbnailUrl = hasLockedMedia
  ? lockedPreviewMedia?.url ?? null
  : null
const lockedPreviewText = post.content ?? ""





  return (
   <main className="min-h-screen bg-zinc-950 px-0 py-8  text-white sm:px-6 sm:py-10">
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
  <LockedPostCard
    previewText={lockedPreviewText}
    createdAt={formatDate(post.publishedAt ?? post.createdAt)}
    previewThumbnailUrl={lockedPreviewThumbnailUrl}
    price={post.price ?? undefined}
    lockReason={
      lockReason === "subscription" || lockReason === "purchase"
        ? lockReason
        : undefined
    }
    action={
      lockReason === "subscription" ? (
        <SubscribeButton
          creatorId={post.creatorId}
          creatorUserId={post.creatorUserId}
          currentUserId={user.id}
        />
      ) : (
        <PostPurchaseButton postId={post.id} />
      )
    }
  />
) : (
  <PostCard
    postId={post.id}
    text={detailCardText}
    createdAt={post.publishedAt ?? post.createdAt}
    media={detailCardMedia}
    blocks={detailCardBlocks}
    isLocked={false}
    creator={detailCreator}
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