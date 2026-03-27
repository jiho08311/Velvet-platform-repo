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

function formatPrice(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amountCents)
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

          {isOwner ? <CreatePostComposer creatorId={creator.id} /> : null}

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
                      {new Date(post.created_at).toLocaleString()}
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
                          {post.visibility === "paid"
                            ? `Purchase this post for ${formatPrice(
                                post.price_cents ?? 0,
                                "KRW"
                              )}.`
                            : "Subscribe to unlock this post."}
                        </p>

                        {post.visibility === "paid" ? (
                          <div className="mt-4 flex justify-center">
                            <PostPurchaseButton postId={post.id} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 pb-5 pt-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                        {post.content ?? ""}
                      </p>
                    </div>
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