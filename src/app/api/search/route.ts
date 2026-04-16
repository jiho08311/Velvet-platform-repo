import { NextResponse } from "next/server"
import { searchCreators } from "@/modules/search/server/search-creators"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

const query = searchParams.get("query") ?? ""
const limitParam = searchParams.get("limit")
const cursor = searchParams.get("cursor")

const limit = limitParam ? Number(limitParam) : undefined

    if (!query) {
      return NextResponse.json(
        {
          creators: [],
        },
        { status: 200 }
      )
    }

const result = await searchCreators({
  query,
  limit,
  cursor,
})

  return NextResponse.json(
  {
    creators: result.items,
    nextCursor: result.nextCursor,
  },
  { status: 200 }
)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}