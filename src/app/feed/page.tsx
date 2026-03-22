import { redirect } from "next/navigation"

import { getSession } from "@/modules/auth/server/get-session"
import { getHomeFeed } from "@/modules/feed/server/get-home-feed"
import { FeedList } from "@/modules/feed/ui/FeedList"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"

export default async function FeedPage() {
  const session = await getSession()

  if (!session) {
    redirect("/sign-in?next=/feed")
  }

  const feed = await getHomeFeed({
    viewerUserId: session.userId,
    limit: 20,
  })

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <Card className="p-3">
              <nav className="flex flex-col gap-2">
                <a
                  href="/feed"
                  className="rounded-2xl bg-[#C2185B] px-4 py-3 text-sm font-semibold text-white"
                >
                  Home
                </a>

                <a
                  href="/messages"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Message
                </a>

                <a
                  href="/explore"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Explore
                </a>

                <a
                  href="/explore-tab"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Explore Tab
                </a>

                <a
                  href="/notifications"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Notification
                </a>

                <button
                  type="button"
                  className="rounded-2xl bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Post
                </button>

                <a
                  href="/profile"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Profile
                </a>

                <a
                  href="/settings"
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Settings
                </a>
              </nav>
            </Card>
          </div>
        </aside>

        {/* CENTER FEED */}
        <section className="min-w-0">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-zinc-200 bg-white px-6 py-5">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C2185B]">
                  Feed
                </p>
                <h1 className="text-2xl font-semibold text-zinc-900">
                  Home feed
                </h1>
                <p className="text-sm leading-6 text-zinc-500">
                  Discover the latest creator posts and updates.
                </p>
              </div>
            </div>

            <div className="border-b border-zinc-200 bg-zinc-50/70 px-6 py-4">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-400">
                Share something with your subscribers...
              </div>
            </div>

            <div className="p-6">
              {feed.items.length === 0 ? (
                <EmptyState
                  title="No posts yet"
                  description="Posts from creators you follow will appear here."
                />
              ) : (
                <FeedList
                  posts={feed.items.map((item) => ({
                    id: item.id,
                    text: item.text,
                    createdAt: item.createdAt,
                  }))}
                  emptyMessage="No posts yet from creators you subscribe to."
                />
              )}
            </div>
          </Card>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card>
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Search posts
                </h2>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400">
                  Search creator posts...
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Recommended for you
                </h2>

                <div className="space-y-3">
                  {["Luna Velvet", "Mina Rose", "Ari Night"].map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                          {name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Recommended creator
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </main>
  )
}