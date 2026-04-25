import {
  incrementLikeCountMap,
  readLikeCountFromMap,
} from "./like-interaction-result"

type PostLikeCountRow = {
  post_id: string
}

export function buildPostLikeCountMap(
  rows: PostLikeCountRow[] | null | undefined
): Map<string, number> {
  const countMap = new Map<string, number>()

  for (const row of rows ?? []) {
    incrementLikeCountMap(countMap, row.post_id)
  }

  return countMap
}

export function readPostLikeCount(
  countMap: Map<string, number>,
  postId: string
): number {
  return readLikeCountFromMap(countMap, postId)
}
