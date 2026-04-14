import { redirect } from "next/navigation"
import { Avatar } from "@/shared/ui/Avatar"
import { assertPassVerified } from "@/modules/auth/server/assert-pass-verified"
import { getSession } from "@/modules/auth/server/get-session"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getHomeFeed } from "@/modules/feed/server/get-home-feed"
import { FeedComposer } from "@/modules/feed/ui/FeedComposer"
import { FeedEmptyState } from "@/modules/feed/ui/FeedEmptyState"
import { FeedList } from "@/modules/feed/ui/FeedList"
import { getRecommendedCreators } from "@/modules/search/server/get-recommended-creators"
import { getStories } from "@/modules/story/server/get-stories"

import { StoryList } from "@/modules/story/ui/StoryList"
import { Card } from "@/shared/ui/Card"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getStoryReadStateMap } from "@/modules/story/server/story-read-state"

type FeedMediaItem = {
  id?: string
  url: string
  type?: "image" | "video" | "audio" | "file"
}

type ProfileRow = {
  username: string | null
}

function normalizeMedia(item: unknown): FeedMediaItem[] {
  if (!item || typeof item !== "object") {
    return []
  }

  const maybeItem = item as {
    media?: Array<{
      id?: string
      url: string
      type?: "image" | "video" | "audio" | "file"
    }>
    mediaThumbnailUrls?: string[]
  }

  if (Array.isArray(maybeItem.media)) {
    return maybeItem.media.map((m) => ({
      id: m.id,
      url: m.url ?? "",
      type: m.type,
    }))
  }

  if (Array.isArray(maybeItem.mediaThumbnailUrls)) {
    return maybeItem.mediaThumbnailUrls.map((url) => ({
      url,
      type: "image" as const,
    }))
  }

  return []
}

function normalizePrice(item: unknown): number | undefined {
  if (!item || typeof item !== "object") {
    return undefined
  }

  const maybeItem = item as {
    price?: number
  }

  return typeof maybeItem.price === "number"
    ? maybeItem.price
    : undefined
}

export default async function FeedPage() {
  const session = await getSession()

  if (session) {
    try {
      await requireActiveUser()
    } catch {
      redirect("/reactivate-account")
    }

    try {
      await assertPassVerified({ profileId: session.userId })
    } catch {
      redirect("/verify-pass")
    }
  }

  let currentCreatorId: string | undefined

  if (session) {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("id", session.userId)
      .maybeSingle<ProfileRow>()

    if (profileError) {
      throw profileError
    }

    if (!profile?.username) {
      redirect("/onboarding")
    }

    const creator = await getCreatorByUserId(session.userId)
    currentCreatorId = creator?.id
  }

  let feed
  let recommendedCreators
  let stories
  let readStateMap: Record<string, string> = {}

  if (session?.userId) {
    const map = await getStoryReadStateMap(session.userId)
    readStateMap = Object.fromEntries(map)
  }

  if (session?.userId) {
    ;[feed, recommendedCreators, stories] = await Promise.all([
      getHomeFeed({
        viewerUserId: session.userId,
        limit: 10,
      }),
      getRecommendedCreators({
        viewerUserId: session.userId,
        limit: 3,
      }),
      getStories(session.userId),
    ])
  } else {
    ;[feed, recommendedCreators, stories] = await Promise.all([
      getHomeFeed({
        limit: 10,
      } as any),
      getRecommendedCreators({
        limit: 3,
      } as any),
      getStories(),
    ])
  }

  return (
    <main className="min-h-screen">
      <div className="grid w-full grid-cols-1 gap-6 px-0 py-2 sm:px-0 lg:grid-cols-[632px_320px] lg:justify-center lg:gap-16 lg:pl-16 xl:gap-20 xl:pl-24">
        <section className="min-w-0 w-full max-w-[632px] mx-auto lg:mx-0 lg:justify-self-end space-y-3">

          <StoryList
            stories={stories}
            readStateMap={readStateMap}
            currentCreatorId={currentCreatorId}
          />

          {session ? <FeedComposer userId={session.userId} /> : null}

          {feed.items.length === 0 ? (
            <FeedEmptyState
              title="No posts yet"
              description="Posts from creators you follow will appear here."
            />
          ) : (
            <FeedList
  posts={feed.items.map((item) => ({
  id: item.id,
  postId: item.id,
  creatorId: item.creatorId,
  creatorUserId: item.creatorUserId,
  currentUserId: session?.userId ?? undefined,
  text: item.text,
  createdAt: item.createdAt,
  media: normalizeMedia(item),
  blocks: "blocks" in item && Array.isArray(item.blocks) ? item.blocks : [],
  isLocked: item.isLocked,
  lockReason: item.lockReason,
  price: normalizePrice(item),
  commentsCount: item.commentsCount,
  likesCount: item.likesCount,
  isLiked: item.isLiked,
  creator: item.creator,
}))}
            />
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 ml-2">
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
                          href={`/creator/${creator.username}`}
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