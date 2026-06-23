import { Avatar } from "@/shared/ui/Avatar"
import { buildCreatorRoutePath } from "@/modules/creator/public/creator-identity"
import {
  FeedComposer,
  FeedInfiniteList,
} from "@/modules/feed/public/feed-page-ui"
import { StoryList } from "@/modules/story/public/story-list-ui"
import { Card } from "@/shared/ui/Card"
import { loadFeedPageData } from "./feed-page-data"

export default async function FeedPage() {
  const {
    currentCreatorId,
    feed,
    initialFeedPosts,
    readStateMap,
    recommendedCreators,
    session,
    stories,
  } = await loadFeedPageData()

  const feedEmptyState = {
    title: "No posts yet",
    message: "Posts from creators you follow will appear here.",
  } as const

  return (
    <main className="min-h-screen">
      <div className="grid w-full grid-cols-1 gap-6 px-0 py-2 sm:px-0 lg:grid-cols-[600px_378px] lg:gap-8">
        <section className="min-w-0 w-full max-w-[600px] mx-auto lg:mx-0 space-y-3">
          <StoryList
            stories={stories}
            readStateMap={readStateMap}
            currentCreatorId={currentCreatorId}
          />

          {session ? <FeedComposer userId={session.userId} /> : null}

          <FeedInfiniteList
            initialPosts={initialFeedPosts}
            initialCursor={feed.nextCursor}
            currentUserId={session?.userId ?? undefined}
            emptyTitle={feedEmptyState.title}
            emptyMessage={feedEmptyState.message}
          />
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="border-zinc-800 bg-zinc-900/70 p-4">
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-white">
                  Recommended for you
                </h2>

                {recommendedCreators.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No recommendations available yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendedCreators.map((creator) => (
                      <div
                        key={creator.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar
                            src={creator.avatarUrl}
                            alt={creator.username}
                            fallback={creator.displayName ?? creator.username}
                            size="md"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {creator.displayName ?? creator.username}
                            </p>
                            <p className="truncate text-sm text-zinc-300">
                              @{creator.username}
                            </p>
                          </div>
                        </div>

                        <a
                          href={buildCreatorRoutePath({
                            username: creator.username,
                          })}
                          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </main>
  )
}
