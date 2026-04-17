import Link from "next/link"
import { notFound } from "next/navigation"
import { getCreatorPage } from "@/modules/creator/server/get-creator-page"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed"
import { getMyPosts } from "@/modules/post/server/get-my-posts"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"


import { ReportButton } from "@/modules/report/ui/ReportButton"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import { SubscriptionStatusCard } from "@/modules/subscription/ui/SubscriptionStatusCard"
import { Card } from "@/shared/ui/Card"
import { CreatorContentTabs } from "@/modules/creator/ui/CreatorContentTabs"



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

  const posts = isOwner
    ? (await getMyPosts({ creatorId: creator.id })).items.map((post) => ({
        id: post.id,
        content: post.text ?? "",
        created_at: post.createdAt,
        media: post.media ?? [],
        blocks: [],
        isLocked: false,
        lockReason: undefined,
        price: 0,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        status: post.status,
        published_at: post.publishedAt,
        publishedAt: post.publishedAt,
      }))
    : userId
      ? await getCreatorFeed({
          creatorId: creator.id,
          creatorUserId: creator.userId,
          userId,
        })
      : ((await getCreatorPage({ username, viewerUserId: null }))?.posts ?? []).map(
          (post) => ({
            id: post.id,
            content: post.text ?? "",
            created_at: post.createdAt,
            media: post.media ?? [],
            blocks:
              "blocks" in post && Array.isArray(post.blocks)
                ? post.blocks
                : [],
            isLocked: post.isLocked,
            lockReason: undefined,
            price: post.price ?? 0,
            likesCount: post.likesCount ?? 0,
            commentsCount: post.commentsCount ?? 0,
            isLiked: false,
            status: "status" in post ? post.status : "published",
            publishedAt: "publishedAt" in post ? post.publishedAt : null,
          })
        )

  const updatePosts = posts.filter(
  (post) =>
    (post.media?.length ?? 0) === 0 ||
    post.status !== "published"
)

const mediaPosts = posts.filter(
  (post) =>
    (post.media?.length ?? 0) > 0 &&
    post.status === "published"
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
      <div className="grid w-full grid-cols-1 gap-6 px-0 pb-6 pt-6 lg:grid-cols-[600px_378px] lg:gap-8 lg:px-0">
        <section className="min-w-0 w-full max-w-[600px] px-4 mx-auto lg:mx-0 lg:px-0">
          <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

          <div className="mt-[-40px] flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4 sm:gap-5">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-950 bg-zinc-900 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
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
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  {creator.displayName ?? creator.username}
                </h1>

                <p className="mt-1 text-sm text-zinc-500">@{creator.username}</p>
              </div>
            </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end sm:gap-4">
  {isOwner ? (
    <Link
      href="/profile/edit"
      className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-800 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 sm:w-auto"
    >
      Edit profile
    </Link>
  ) : (
    <>
      <div className="text-left sm:text-right">
        <p className="text-lg font-semibold text-white">
          {formatPrice(creator.subscriptionPrice)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          monthly subscription
        </p>
      </div>

      <div className="w-full sm:min-w-[220px]">
        <SubscribeButton
          creatorId={creator.id}
          creatorUserId={creator.userId}
          currentUserId={userId ?? undefined}
          creatorUsername={creator.username}
        />
      </div>
    </>
  )}
</div>
          </div>

      <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-400">
  {creator.bio ?? "No bio yet."}
</p>

          {!isOwner ? (
            <div className="mt-3">
              <ReportButton
                targetType="creator"
                targetId={creator.id}
                pathname={pathname}
                currentUserId={userId ?? undefined}
              />
            </div>
          ) : null}

          {!isOwner ? (
            <div className="mt-5">
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

      <div className="mt-4 flex items-center gap-8 text-sm text-zinc-400">
  <div>
    <p className="text-base font-semibold text-white">{mediaPosts.length}</p>
    <p className="mt-1 text-zinc-500">Posts</p>
  </div>

  <div>
    <p className="text-base font-semibold text-white">{updatePosts.length}</p>
<p className="mt-1 text-zinc-500">Updates</p>
  </div>

  <div>
    <p className="text-base font-semibold text-white">
      {formatCount(summary?.subscriberCount)}
    </p>
<p className="mt-1 text-zinc-500">Subscribers</p>
  </div>
</div>

          <div className="mt-8">
            {isOwner ? <CreatePostComposer creatorId={creator.id} /> : null}

            {posts.length === 0 ? (
              <div className="text-center text-sm text-zinc-500">No posts yet</div>
            ) : (
       <div>
<CreatorContentTabs
  mediaPosts={mediaPosts}
  updatePosts={updatePosts}
  isOwner={isOwner}
/>
</div>
            )}
          </div>
        </section>

        <aside className="hidden lg:block w-full max-w-[378px] mx-auto lg:mx-0">
          <div className="space-y-4 lg:sticky lg:top-24">
            {!isOwner ? (
  <Card className="border-zinc-800 bg-zinc-900/70 p-5">
  <div className="space-y-4">
    <div>
      <p className="text-lg font-semibold text-white">
        {formatPrice(creator.subscriptionPrice)}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        monthly subscription
      </p>
    </div>

    <p className="text-sm leading-6 text-zinc-400">
      Subscribe to unlock posts, updates, and subscriber-only content from{" "}
      {creator.displayName ?? creator.username}.
    </p>

    <SubscribeButton
      creatorId={creator.id}
      creatorUserId={creator.userId}
      currentUserId={userId ?? undefined}
      creatorUsername={creator.username}
    />
  </div>
</Card>
            ) : null}
          </div>
        </aside>
      </div>
    
    </main>
  )
}