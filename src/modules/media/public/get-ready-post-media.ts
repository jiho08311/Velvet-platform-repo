"use server"
// PUBLIC_CONTRACT

import {
  getReadyExplorePostMediaRowsByPostIds as getReadyExplorePostMediaRowsByPostIdsUseCase,
  getReadyPostMediaRowsByPostIds as getReadyPostMediaRowsByPostIdsUseCase,
} from "@/modules/media/use-cases/get-ready-post-media"

export async function getReadyPostMediaRowsByPostIds(postIds: string[]) {
  return getReadyPostMediaRowsByPostIdsUseCase(postIds)
}

export async function getReadyExplorePostMediaRowsByPostIds(
  postIds: string[]
) {
  return getReadyExplorePostMediaRowsByPostIdsUseCase(postIds)
}
