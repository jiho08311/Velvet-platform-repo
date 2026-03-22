import { NextResponse } from "next/server"
import { searchCreators } from "@/modules/search/server/search-creators"
import { searchPosts } from "@/modules/search/server/search-posts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("query") ?? ""
    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number(limitParam) : undefined

    const [creators, posts] = await Promise.all([
      searchCreators({ query, limit }),
      searchPosts({ query, limit }),
    ])

    return NextResponse.json(
      {
        creators,
        posts,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}