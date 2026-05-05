import {
  findReadyExplorePostMediaRowsByPostIds,
  findReadyPostMediaRowsByPostIds,
  type ReadyExplorePostMediaRow,
  type ReadyPostMediaRow,
} from "@/modules/media/repositories/media-read-repository"

export type { ReadyExplorePostMediaRow, ReadyPostMediaRow }

export async function getReadyPostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyPostMediaRow[]> {
  return findReadyPostMediaRowsByPostIds(postIds)
}

export async function getReadyExplorePostMediaRowsByPostIds(
  postIds: string[]
): Promise<ReadyExplorePostMediaRow[]> {
  return findReadyExplorePostMediaRowsByPostIds(postIds)
}
