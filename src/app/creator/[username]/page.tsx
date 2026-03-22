import { notFound } from "next/navigation"
import { PostPurchaseButton } from "@/modules/post/ui/PostPurchaseButton"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUsername } from "@/modules/creator/server/get-creator-by-username"
import { getCreatorDashboardSummary } from "@/modules/analytics/server/get-creator-dashboard-summary"
import { getCreatorFeed } from "@/modules/post/server/get-creator-feed"
import SubscribeButton from "@/modules/creator/ui/SubscribeButton"

type CreatorPageProps = {
  params: Promise<{
    username: string
  }>
}

function formatPrice(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amountCents / 100)
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

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="h-32 bg-gradient-to-r from-[#FCE4EC] via-white to-[#FFF1F5] sm:h-40" />

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-100 text-2xl font-semibold text-zinc-900 shadow-lg sm:h-24 sm:w-24">
                    {creator.avatarUrl ? (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      creator.displayName.slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-2">
                    <p className="truncate text-sm font-medium text-zinc-500">
                      @{creator.username}
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                      {creator.displayName}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                      {creator.bio || "No bio yet."}
                    </p>

                    <div className="mt-4 inline-flex items-center rounded-full bg-[#FCE4EC] px-4 py-2 text-sm font-semibold text-[#C2185B] ring-1 ring-inset ring-[#C2185B]/15">
                      {formatPrice(
                        creator.subscriptionPriceCents,
                        creator.subscriptionCurrency
                      )}{" "}
                      / month
                    </div>

                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                      Current user
                    </p>
                    <p className="mt-1 break-all text-xs text-zinc-500">
                      {userId ?? "not logged in"}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <SubscribeButton
                    creatorId={creator.id}
                    creatorUserId={creator.userId}
                    currentUserId={userId}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Total subscribers
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {summary.subscriberCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Active subscribers
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {summary.activeSubscriberCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    Monthly revenue
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900">
                    {formatPrice(summary.monthlyRevenueCents, "USD")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                Posts
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                Creator posts
              </h2>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-10 text-center">
              <p className="text-lg font-semibold text-zinc-900">No posts yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                This creator has not published any posts yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:border-[#C2185B]/30"
                >
                  <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-zinc-500">
                      {new Date(
                        post.published_at ?? post.created_at
                      ).toLocaleString()}
                    </p>

                    <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700">
                      {post.visibility}
                    </span>
                  </div>

                  {post.isLocked ? (
                    <div className="px-5 py-10">
                      <div className="rounded-2xl border border-[#C2185B]/15 bg-[#FFF1F5] p-6 text-center">
                        <p className="text-lg font-semibold text-zinc-900">
                          Locked content
                        </p>

                        <p className="mt-2 text-sm text-zinc-600">
                          {post.price_cents !== null
                            ? `Purchase this post for ${formatPrice(post.price_cents, "USD")}.`
                            : "Subscribe to unlock this post."}
                        </p>

                        {post.price_cents !== null ? (
                          <div className="mt-4 flex justify-center">
                            <PostPurchaseButton postId={post.id} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.media_thumbnail_urls &&
                      post.media_thumbnail_urls.length > 0 ? (
                        <div className="mt-4 grid grid-cols-2 gap-2 px-5 sm:grid-cols-3">
                          {post.media_thumbnail_urls
                            .slice(0, 3)
                            .map((url: string, index: number) => (
                              <div
                                key={`${url}-${index}`}
                                className="aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
                              >
                                <img
                                  src={url}
                                  alt={`Post media ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                        </div>
                      ) : null}

                      <div className="px-5 pb-5 pt-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                          {post.content ?? post.title ?? ""}
                        </p>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}