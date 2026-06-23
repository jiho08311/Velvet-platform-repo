import { buildPostLikeCountMap } from "@/shared/lib/post-like-count"
import {
  countCommentsByPostIds,
  findPostLikeRowsByPostIds,
  findUserPostLikeRowsByPostIds,
} from "@/modules/post/public/post-interaction-read-model"

export async function loadHomeFeedEngagement(input: {
  postIds: string[]
  viewerUserId: string
}) {
  const likeRows = await findPostLikeRowsByPostIds(input.postIds)
  const likeCountMap = buildPostLikeCountMap(likeRows)
  let myLikeSet = new Set<string>()

  if (input.viewerUserId) {
    const myLikeRows = await findUserPostLikeRowsByPostIds({
      userId: input.viewerUserId,
      postIds: input.postIds,
    })

    myLikeSet = new Set(myLikeRows.map((row) => row.post_id))
  }

  const commentCountMap = await countCommentsByPostIds(input.postIds)

  return {
    commentCountMap,
    likeCountMap,
    myLikeSet,
  }
}
