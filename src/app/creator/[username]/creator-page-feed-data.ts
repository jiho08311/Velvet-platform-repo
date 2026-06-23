import { readCreatorDashboard } from "@/modules/analytics/public/read-creator-dashboard"
import { getCreatorFeed } from "@/modules/post/public/get-creator-feed"

export async function loadCreatorPageFeedData(input: {
  creatorId: string
  creatorUserId: string
  userId: string | null
}) {
  const [analytics, posts] = await Promise.all([
    readCreatorDashboard(input.creatorId),
    getCreatorFeed({
      creatorId: input.creatorId,
      creatorUserId: input.creatorUserId,
      userId: input.userId,
    }),
  ])

  function getPostRenderMediaCount(post: (typeof posts)[number]) {
    return post.renderInput.blockMedia.length || post.media?.length || 0
  }

  return {
    analytics,
    mediaPosts: posts.filter(
      (post) => getPostRenderMediaCount(post) > 0 && post.status === "published"
    ),
    posts,
    updatePosts: posts.filter(
      (post) =>
        getPostRenderMediaCount(post) === 0 || post.status !== "published"
    ),
  }
}
