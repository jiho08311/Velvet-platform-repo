import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { getHomeFeed } from "@/modules/feed/server/get-home-feed"
import { FeedList } from "@/modules/feed/ui/FeedList"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

export default async function FeedPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-zinc-200 bg-gradient-to-r from-[#C2185B]/10 via-white to-white px-6 py-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                  Feed
                </p>
                <h1 className="text-3xl font-semibold text-zinc-900">
                  Home feed
                </h1>
                <p className="text-sm leading-6 text-zinc-500">
                  See the latest posts from creators you follow.
                </p>
              </div>
            </div>

            <div className="p-6">
              <EmptyState
                title="Sign in to view your feed"
                description="Sign in to see the latest posts from creators you follow."
              />
            </div>
          </Card>
        </div>
      </main>
    )
  }

  const feed = await getHomeFeed({
    viewerUserId: session.userId,
    limit: 20,
  })

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-[#C2185B]/10 via-white to-white px-6 py-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                Feed
              </p>
              <h1 className="text-3xl font-semibold text-zinc-900">
                Home feed
              </h1>
              <p className="text-sm leading-6 text-zinc-500">
                Discover the latest creator posts and updates.
              </p>
            </div>
          </div>

          <div className="p-6">
            <FeedList
              posts={feed.items.map((item) => ({
                id: item.id,
                text: item.text,
                createdAt: item.createdAt,
              }))}
              emptyMessage="No posts yet from creators you subscribe to."
            />
          </div>
        </Card>
      </div>
    </main>
  )
}