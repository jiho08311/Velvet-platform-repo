import Link from "next/link"
import { notFound } from "next/navigation"
import { getCreatorPage } from "@/modules/creator/server/get-creator-page"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"
import { PostCard } from "@/modules/post/ui/PostCard"
import { ReportButton } from "@/modules/report/ui/ReportButton"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import { SubscriptionStatusCard } from "@/modules/subscription/ui/SubscriptionStatusCard"

type CreatorPageProps = {
  params: Promise<{
    username: string
  }>
}


function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount)
}

function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0)
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { username } = await params

  if (!username) {
    notFound()
  }

const creator = await getCreatorByUsername(username)

if (!creator) {
  notFound()
}

if (creator.status !== "active") {
  notFound()
}


  
  const user = await getCurrentUser()
  const userId = user?.id ?? null
  const isOwner = userId === creator.userId
  const pathname = `/creator/${username}`

  const summary = await getCreatorDashboardSummary(creator.id)

const posts = userId
  ? await getCreatorFeed({
      creatorId: creator.id,
      userId,
    })
  : ((await getCreatorPage({ username, viewerUserId: null }))?.posts ?? []).map(
      (post) => ({
        id: post.id,
        content: post.text ?? "",
        created_at: post.createdAt,
        media: post.media ?? [],
        isLocked: post.isLocked,
   lockReason: undefined,
        price: post.price ?? 0,
        likesCount: 0,
        isLiked: false,
      })
    )

  const viewerSubscription = userId
    ? await getViewerSubscription(userId, creator.id)
    : {
        isActive: false,
        subscription: null,
      }

  const subscriptionStatus: "active" | "canceled" | "expired" | "inactive" =
    viewerSubscription.isActive
      ? "active"
      : viewerSubscription.subscription
        ? viewerSubscription.subscription.status
        : "inactive"

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 pb-32 pt-6">
        <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

        <div className="mt-[-40px] flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-950 bg-zinc-900">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName ?? creator.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                  {(creator.displayName ?? creator.username)
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-xl font-semibold text-white">
                {creator.displayName ?? creator.username}
              </h1>

              <p className="text-sm text-zinc-400">@{creator.username}</p>
            </div>
          </div>

          <div className="hidden flex-col items-end gap-2 md:flex">
            {isOwner ? (
              <Link
                href="/profile/edit"
                className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
              >
                Edit
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium text-white">
                  {formatPrice(creator.subscriptionPrice)}
                  <span className="ml-1 text-zinc-400">구독</span>
                </p>

                <SubscribeButton
                  creatorId={creator.id}
                  creatorUserId={creator.userId}
                  currentUserId={userId ?? undefined}
                  creatorUsername={creator.username}
                />
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          {creator.bio ?? "No bio yet."}
        </p>

        {!isOwner ? (
          <div className="mt-2">
            <ReportButton
              targetType="creator"
              targetId={creator.id}
              pathname={pathname}
                currentUserId={userId ?? undefined}
            />
          </div>
        ) : null}

        {!isOwner ? (
          <div className="mt-4">
            <SubscriptionStatusCard
              status={subscriptionStatus}
              currentPeriodEndAt={
                viewerSubscription.subscription?.currentPeriodEndAt
              }
              cancelAtPeriodEnd={Boolean(
                viewerSubscription.subscription?.cancelAtPeriodEnd
              )}
            />
          </div>
        ) : null}

        {!isOwner ? (
          <p className="mt-2 text-sm text-zinc-500">
            구독자 전용 콘텐츠를 확인할 수 있어요
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
          <span>{formatCount(summary?.subscriberCount)} users</span>
          <span>{formatCount(posts.length)} posts</span>
        </div>

        <div className="mt-6 space-y-4">
          {isOwner ? <CreatePostComposer creatorId={creator.id} /> : null}

          {posts.length === 0 ? (
            <div className="text-center text-sm text-zinc-500">No posts yet</div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                text={post.content ?? ""}
                createdAt={new Date(post.created_at).toLocaleString()}
                media={post.media ?? []}
                isLocked={post.isLocked}
             
                likesCount={post.likesCount}
                isLiked={post.isLiked}
                creatorId={creator.id}
                creatorUserId={creator.userId}
                currentUserId={userId ?? undefined}
                creator={{
                  username: creator.username,
                  displayName: creator.displayName ?? creator.username,
                  avatarUrl: creator.avatarUrl ?? null,
                }}
              />
            ))
          )}
        </div>
      </div>

      {!isOwner ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">
                {formatPrice(creator.subscriptionPrice)}
                <span className="ml-1 text-zinc-400">구독</span>
              </p>
              <p className="truncate text-xs text-zinc-500">
                구독자 전용 콘텐츠
              </p>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <SubscribeButton
                creatorId={creator.id}
                creatorUserId={creator.userId}
                currentUserId={userId ?? undefined}
                creatorUsername={creator.username}
              />
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}