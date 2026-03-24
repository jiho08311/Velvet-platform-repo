import Link from "next/link"
import { notFound } from "next/navigation"
import { PostPurchaseButton } from "@/modules/post/ui/PostPurchaseButton"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"
import { CreatePostComposer } from "@/modules/post/ui/CreatePostComposer"

type CreatorPageProps = {
  params: Promise<{
    username: string
  }>
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
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

  const summary = await getCreatorDashboardSummary(creator.id)
  const user = await getCurrentUser()
  const userId = user?.id

  const posts = await getCreatorFeed({
    creatorId: creator.id,
    userId,
  })

  const isOwner = userId === creator.userId

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
          <div className="h-28 bg-gradient-to-r from-[#C2185B] via-[#D81B60] to-[#F06292]" />

          <div className="px-5 pb-6 pt-0 sm:px-6">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-100 text-2xl font-semibold text-zinc-700 shadow-sm">
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName ?? creator.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (creator.displayName ?? creator.username).slice(0, 1).toUpperCase()
                  )}
                </div>

                <div className="pb-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                    Creator
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
                    {creator.displayName ?? creator.username}
                  </h1>
                  <p className="mt-1 text-sm text-zinc-500">@{creator.username}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {isOwner ? (
                  <Link
                    href="/profile/edit"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Edit profile
                  </Link>
                ) : (
                  <>
                    <Link
                      href={`/messages/new?creatorUsername=${creator.username}`}
                      className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Send message
                    </Link>

                    <SubscribeButton creatorId={creator.id} />
                  </>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm leading-7 text-zinc-600">
                {creator.bio ?? "No bio yet."}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Subscribers
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {formatCount(summary?.subscriberCount)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Posts
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {formatCount(posts.length)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Revenue
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {formatPrice(summary?.monthlyRevenue ?? 0, "USD")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 나머지 그대로 유지 */}
      </div>
    </main>
  )
}