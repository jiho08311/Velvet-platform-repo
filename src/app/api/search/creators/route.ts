import { NextResponse } from "next/server"
import { searchCreators } from "@/modules/search/server/search-creators"
import type { CreatorSearchResponse } from "@/modules/search/types"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("query") ?? ""
    const limitParam = searchParams.get("limit")

    const limit = limitParam ? Number(limitParam) : undefined

    const result = await searchCreators({
      query,
      limit,
    })

    const response: CreatorSearchResponse = {
      creators: result.items,
      nextCursor: result.nextCursor,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search creators"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
