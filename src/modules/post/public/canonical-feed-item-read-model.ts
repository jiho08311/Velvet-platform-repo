import {
  listCanonicalFeedItems as listCanonicalFeedItemsRepository,
} from "@/modules/post/repositories/feed-projection-repository"

export const PUBLIC_CONTRACT = true

export type ListCanonicalFeedItemsInput = Parameters<
  typeof listCanonicalFeedItemsRepository
>[0]
export type ListCanonicalFeedItemsResult = Awaited<
  ReturnType<typeof listCanonicalFeedItemsRepository>
>

export async function listCanonicalFeedItems(
  input: ListCanonicalFeedItemsInput
): Promise<ListCanonicalFeedItemsResult> {
  return listCanonicalFeedItemsRepository(input)
}
