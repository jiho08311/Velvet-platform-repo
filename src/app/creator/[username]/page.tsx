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
import { PostCard } from "@/modules/post/ui/PostCard"
import { UpcomingCard } from "@/modules/feed/ui/UpcomingCard"
import { ReportButton } from "@/modules/report/ui/ReportButton"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import { SubscriptionStatusCard } from "@/modules/subscription/ui/SubscriptionStatusCard"
import { Card } from "@/shared/ui/Card"

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
      <div className="grid w-full grid-cols-1 gap-6 px-4 pb-6 pt-6 sm:px-4 lg:grid-cols-[600px_378px] lg:gap-8 lg:px-0">
        <section className="min-w-0 w-full max-w-[600px] mx-auto lg:mx-0">
          <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

          <div className="mt-[-40px] flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              {isOwner ? (
             <Link
  href="/profile/edit"
  className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-800 px-4 text-sm font-semibold text-white hover:bg-zinc-700 sm:w-auto"
>
                  Edit profile
                </Link>
              ) : (
                <>
                  <p className="text-sm font-medium text-white">
                    {formatPrice(creator.subscriptionPrice)}
                    <span className="ml-1 text-zinc-400">구독</span>
                  </p>

                  <div className="w-full sm:min-w-[180px]">
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

          <div className="mt-6">
            {isOwner ? <CreatePostComposer creatorId={creator.id} /> : null}

            {posts.length === 0 ? (
              <div className="text-center text-sm text-zinc-500">No posts yet</div>
            ) : (
              <div className="-mx-4 lg:mx-0">
                {posts.map((post) => {
                  const isScheduled =
                    "status" in post && post.status === "scheduled"

                  if (isScheduled) {
                    return (
                      <div key={post.id} className="px-4 py-3 lg:px-0">
                        <UpcomingCard
                          title="Upcoming post"
                          previewText={isOwner ? post.content ?? null : null}
                          scheduledAt={
                            "publishedAt" in post
                              ? post.publishedAt ?? ""
                              : "published_at" in post
                                ? post.published_at ?? ""
                                : ""
                          }
                          creator={{
                            username: creator.username,
                            displayName: creator.displayName ?? creator.username,
                            avatarUrl: creator.avatarUrl ?? null,
                          }}
                        />
                      </div>
                    )
                  }

                  return (
                    <div key={post.id} className="relative">
                      {isOwner && "status" in post && post.status === "draft" ? (
                        <div className="absolute left-3 top-3 z-10 rounded-full bg-zinc-900/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                          Draft
                        </div>
                      ) : null}

                      <PostCard
                        postId={post.id}
                        text={post.content ?? ""}
                        createdAt={new Date(post.created_at).toLocaleString()}
                        media={post.media ?? []}
                        blocks={post.blocks ?? []}
                        isLocked={post.isLocked}
                        commentsCount={post.commentsCount}
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden lg:block w-full max-w-[378px] mx-auto lg:mx-0">
          <div className="space-y-4 lg:sticky lg:top-24">
            {!isOwner ? (
              <Card className="border-zinc-800 bg-zinc-900/70 p-5">
                <div className="space-y-4">
                  <SubscriptionStatusCard
                    status={subscriptionStatus}
                    currentPeriodEndAt={
                      viewerSubscription.subscription?.currentPeriodEndAt
                    }
                    cancelAtPeriodEnd={Boolean(
                      viewerSubscription.subscription?.cancelAtPeriodEnd
                    )}
                  />

                  <p className="text-sm text-zinc-500">
                    구독자 전용 콘텐츠를 확인할 수 있어요
                  </p>
                </div>
              </Card>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  )
}