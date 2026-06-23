import {
  listContentPublicCardsByPostIds as listContentPublicCardsByPostIdsRepository,
} from "@/modules/content/repositories/content-public-card-repository"

export const PUBLIC_CONTRACT = true

export type ContentPublicCardRow = Awaited<
  ReturnType<typeof listContentPublicCardsByPostIdsRepository>
>[number]

export function listContentPublicCardsByPostIds(
  postIds: string[]
): ReturnType<typeof listContentPublicCardsByPostIdsRepository> {
  return listContentPublicCardsByPostIdsRepository(postIds)
}
