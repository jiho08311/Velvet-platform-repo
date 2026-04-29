import type { CreatorSearchResponse } from "../creator-search-contract"
import { searchCreators } from "./search-creators"

export type CreatorSearchApiRequest = {
  query: string
  limit?: number
  cursor: string | null
}

export function readCreatorSearchApiRequest(
  request: Request
): CreatorSearchApiRequest {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? ""
  const limitParam = searchParams.get("limit")
  const cursor = searchParams.get("cursor")

  return {
    query,
    limit: limitParam ? Number(limitParam) : undefined,
    cursor,
  }
}

export async function resolveCreatorSearchApiResponse({
  query,
  limit,
  cursor,
}: CreatorSearchApiRequest): Promise<CreatorSearchResponse> {
  if (!query) {
    return {
      creators: [],
      nextCursor: null,
    }
  }

  const result = await searchCreators({
    query,
    limit,
    cursor,
  })

  return {
    creators: result.items,
    nextCursor: result.nextCursor,
  }
}
