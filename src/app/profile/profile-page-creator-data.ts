import { getCreatorAnalyticsSummary } from "@/modules/analytics/public/get-creator-analytics"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { getCreatorFeed } from "@/modules/post/public/get-creator-feed"

export async function loadProfileCreatorContent(userId: string) {
  const creator = await getCreatorByUserId(userId)
  const creatorId = creator?.id

  const [creatorFeedPosts, summary] = await Promise.all([
    creatorId && creator
      ? getCreatorFeed({
          creatorId,
          creatorUserId: creator.userId,
          userId,
        })
      : Promise.resolve([]),
    creatorId ? getCreatorAnalyticsSummary(creatorId) : Promise.resolve(null),
  ])

  const posts = creatorFeedPosts.map((post) => {
    const resolvedStatus: "draft" | "scheduled" | "published" | "archived" =
      post.status === "scheduled" ? "scheduled" : "published"

    return {
      id: post.id,
      creatorId: creatorId ?? "",
      content: post.content,
      status: resolvedStatus,
      visibility: post.visibility,
      canView: post.canView,
      isLocked: post.isLocked,
      commerce: post.commerce,
      price: post.price,
      createdAt: post.createdAt,
      publishedAt: post.publishedAt ?? null,
      renderInput: post.renderInput,
      media:
        post.media?.map((item) => ({
          id: item.id,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
          sortOrder: item.sortOrder,
        })) ?? [],
    }
  })

  function getPostRenderMediaCount(post: (typeof posts)[number]) {
    return post.renderInput.blockMedia.length || post.media?.length || 0
  }

  return {
    mediaPosts: posts.filter(
      (post) => getPostRenderMediaCount(post) > 0 && post.status === "published"
    ),
    summary,
    updatePosts: posts.filter(
      (post) =>
        getPostRenderMediaCount(post) === 0 || post.status !== "published"
    ),
  }
}
