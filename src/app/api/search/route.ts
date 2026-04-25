import { NextResponse } from "next/server"
import { searchCreators } from "@/modules/search/server/search-creators"
import type { CreatorSearchResponse } from "@/modules/search/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

const query = searchParams.get("query") ?? ""
const limitParam = searchParams.get("limit")
const cursor = searchParams.get("cursor")

const limit = limitParam ? Number(limitParam) : undefined

    if (!query) {
      const emptyResponse: CreatorSearchResponse = {
        creators: [],
        nextCursor: null,
      }

      return NextResponse.json(emptyResponse, { status: 200 })
    }

    const result = await searchCreators({
      query,
      limit,
      cursor,
    })

    const response: CreatorSearchResponse = {
      creators: result.items,
      nextCursor: result.nextCursor,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
