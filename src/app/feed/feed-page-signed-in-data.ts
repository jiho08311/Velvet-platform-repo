import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { getHomeFeed } from "@/modules/feed/public/get-home-feed"
import { readOnboardingReadinessRuntime } from "@/modules/identity/public/onboarding-readiness"
import { getRecommendedCreators } from "@/modules/search/public/get-recommended-creators"

import { redirectToFeedOnboarding } from "./feed-onboarding-redirect"
import { loadFeedStoryData } from "./feed-page-story-data"

export async function loadSignedInFeedData({
  userId,
  nextPath,
}: {
  userId: string
  nextPath: string
}) {
  const [
    onboarding,
    creator,
    storyData,
    feed,
    recommendedCreators,
  ] = await Promise.all([
    readOnboardingReadinessRuntime({ userId }),
    getCreatorByUserId(userId),
    loadFeedStoryData(userId),
    getHomeFeed({
      viewerUserId: userId,
      limit: 10,
    }),
    getRecommendedCreators({
      viewerUserId: userId,
      limit: 3,
    }),
  ])

  if (!onboarding.ok) {
    redirectToFeedOnboarding(nextPath)
  }

  return {
    currentCreatorId: creator?.id,
    feed,
    readStateMap: storyData.readStateMap,
    recommendedCreators,
    stories: storyData.stories,
  }
}
