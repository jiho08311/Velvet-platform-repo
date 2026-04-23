import Link from "next/link"
import { notFound } from "next/navigation"
import { getCreatorPage } from "@/modules/creator/server/get-creator-page"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"
import { ReportButton } from "@/modules/report/ui/ReportButton"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"
import { SubscriptionStatusCard } from "@/modules/subscription/ui/SubscriptionStatusCard"
import { RestrictedStateShell } from "@/shared/ui/RestrictedStateShell"
import { CreatorContentTabs } from "@/modules/creator/ui/CreatorContentTabs"
import { EmptyState } from "@/shared/ui/EmptyState"
import { Avatar } from "@/shared/ui/Avatar"
import {
  CREATOR_PAGE_PRESENTATION,
  CREATOR_SURFACE_EMPTY_STATE,
  getCreatorSubscriptionPresentation,
} from "@/modules/creator/ui/creator-surface-policy"

type CreatorPageProps = {
  params: Promise<{
    username: string
  }>
}

type CreatorIdentitySectionProps = {
  displayName: string
  username: string
  avatarUrl: string | null
}

type CreatorActionSectionProps = {
  isOwner: boolean
  creatorId: string
  creatorUserId: string
  creatorUsername: string
  currentUserId?: string
  subscriptionPrice: number
  displayName: string
}

type CreatorStatsSectionProps = {
  mediaPostCount: number
  updatePostCount: number
  subscriberCount?: number | null
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

function CreatorIdentitySection({
  displayName,
  username,
  avatarUrl,
}: CreatorIdentitySectionProps) {
  return (
    <div className="flex items-end gap-4 sm:gap-5">
      <div className="rounded-full border-4 border-zinc-950 bg-zinc-900 shadow-[0_0_0_1px_rgba(39,39,42,0.6)]">
        <Avatar
          src={avatarUrl}
          alt={displayName}
          fallback={displayName}
          size="xl"
        />
      </div>

      <div className="pb-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {displayName}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">@{username}</p>
      </div>
    </div>
  )
}

function CreatorActionSection({
  isOwner,
  creatorId,
  creatorUserId,
  creatorUsername,
  currentUserId,
  subscriptionPrice,
  displayName,
}: CreatorActionSectionProps) {
  const subscriptionPresentation =
    getCreatorSubscriptionPresentation(displayName)

  if (isOwner) {
    return (
      <div className="flex w-full flex-col gap-4 sm:w-auto sm:items-end">
        <Link
          href="/profile/edit"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-zinc-800 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 sm:w-auto"
        >
          {CREATOR_PAGE_PRESENTATION.ownerEditLabel}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:w-auto sm:items-end">
      <div className="text-left sm:text-right">
        <p className="text-lg font-semibold text-white">
          {formatPrice(subscriptionPrice)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {subscriptionPresentation.pricePeriodLabel}
        </p>
      </div>

      <div className="w-full sm:min-w-[220px]">
        <SubscribeButton
          creatorId={creatorId}
          creatorUserId={creatorUserId}
          currentUserId={currentUserId}
          creatorUsername={creatorUsername}
        />
      </div>
    </div>
  )
}

function CreatorStatsSection({
  mediaPostCount,
  updatePostCount,
  subscriberCount,
}: CreatorStatsSectionProps) {
  return (
    <div className="mt-4 flex items-center gap-8 text-sm text-zinc-400">
      <div>
        <p className="text-base font-semibold text-white">{mediaPostCount}</p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.posts}
        </p>
      </div>

      <div>
        <p className="text-base font-semibold text-white">{updatePostCount}</p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.updates}
        </p>
      </div>

      <div>
        <p className="text-base font-semibold text-white">
          {formatCount(subscriberCount)}
        </p>
        <p className="mt-1 text-zinc-500">
          {CREATOR_PAGE_PRESENTATION.stats.subscribers}
        </p>
      </div>
    </div>
  )
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
        creatorUserId: creator.userId,
        userId,
      })
    : ((await getCreatorPage({ username, viewerUserId: null }))?.posts ?? []).map(
        (post) => ({
          id: post.id,
          creatorId: creator.id,
          content: post.text ?? "",
          createdAt: post.createdAt,
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
          status:
            "status" in post && typeof post.status === "string"
              ? post.status
              : "published",
          publishedAt: "publishedAt" in post ? post.publishedAt : null,
          visibility:
            "visibility" in post && typeof post.visibility === "string"
              ? post.visibility
              : "public",
        })
      )

  const updatePosts = posts.filter(
    (post) => (post.media?.length ?? 0) === 0 || post.status !== "published"
  )

  const mediaPosts = posts.filter(
    (post) => (post.media?.length ?? 0) > 0 && post.status === "published"
  )

  const viewerSubscription = userId
    ? await getViewerSubscription(userId, creator.id)
    : {
        isActive: false,
        subscription: null,
      }

  const status: "active" | "canceled" | "expired" | "inactive" =
    viewerSubscription.isActive
      ? "active"
      : viewerSubscription.subscription?.status === "expired"
        ? "expired"
        : viewerSubscription.subscription?.status === "canceled"
          ? "canceled"
          : "inactive"

  const displayName = creator.displayName ?? creator.username
  const subscriptionPresentation =
    getCreatorSubscriptionPresentation(displayName)

  return (
    <main className="min-h-screen">
      <div className="grid w-full grid-cols-1 gap-6 px-0 pb-6 pt-6 lg:grid-cols-[600px_378px] lg:gap-8 lg:px-0">
        <section className="min-w-0 w-full max-w-[600px] px-4 mx-auto lg:mx-0 lg:px-0">
          <div className="h-40 w-full rounded-3xl bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

          <div className="mt-[-40px] flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <CreatorIdentitySection
              displayName={displayName}
              username={creator.username}
              avatarUrl={creator.avatarUrl}
            />

            <CreatorActionSection
              isOwner={isOwner}
              creatorId={creator.id}
              creatorUserId={creator.userId}
              creatorUsername={creator.username}
              currentUserId={userId ?? undefined}
              subscriptionPrice={creator.subscriptionPrice}
              displayName={displayName}
            />
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-zinc-400">
            {creator.bio ?? CREATOR_PAGE_PRESENTATION.bioFallback}
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
                status={status}
                currentPeriodEndAt={viewerSubscription.subscription?.currentPeriodEndAt}
              />
            </div>
          ) : null}

          <CreatorStatsSection
            mediaPostCount={mediaPosts.length}
            updatePostCount={updatePosts.length}
            subscriberCount={summary?.subscriberCount}
          />

          <div className="mt-8">
            {isOwner ? <CreatePostComposer creatorId={creator.id} /> : null}

            {posts.length === 0 ? (
              <EmptyState
                title={CREATOR_SURFACE_EMPTY_STATE.page.title}
                description={CREATOR_SURFACE_EMPTY_STATE.page.description}
              />
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
              <RestrictedStateShell
                title={formatPrice(creator.subscriptionPrice)}
                description={subscriptionPresentation.unlockDescription}
              >
                <div className="space-y-4">
                  <p className="text-sm text-zinc-500">
                    {subscriptionPresentation.pricePeriodLabel}
                  </p>

                  <SubscribeButton
                    creatorId={creator.id}
                    creatorUserId={creator.userId}
                    currentUserId={userId ?? undefined}
                    creatorUsername={creator.username}
                  />
                </div>
              </RestrictedStateShell>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  )
}
