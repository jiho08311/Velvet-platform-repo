import { getCreatorByUsername } from "@/modules/creator/public/get-creator-by-username"
import { loadCreatorPageAccessData } from "./creator-page-access-data"
import { loadCreatorPageFeedData } from "./creator-page-feed-data"

export async function loadCreatorPageData(username: string) {
  const creator = await getCreatorByUsername(username)

  if (!creator || creator.status !== "active") {
    return null
  }

  const access = await loadCreatorPageAccessData({
    creatorId: creator.id,
    creatorUserId: creator.userId,
  })
  const feed = await loadCreatorPageFeedData({
    creatorId: creator.id,
    creatorUserId: creator.userId,
    userId: access.userId,
  })

  return {
    ...access,
    ...feed,
    creator,
    displayName: creator.displayName ?? creator.username,
    pathname: `/creator/${username}`,
    subscriberCount:
      typeof feed.analytics?.audience.subscriberCount === "number" &&
      Number.isFinite(feed.analytics.audience.subscriberCount)
        ? feed.analytics.audience.subscriberCount
        : 0,
  }
}

export type CreatorPageData = NonNullable<
  Awaited<ReturnType<typeof loadCreatorPageData>>
>
