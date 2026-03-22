import { NextResponse } from "next/server"
import { searchPosts } from "@/modules/search/server/search-posts"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("query") ?? ""
    const limitParam = searchParams.get("limit")

    const limit = limitParam ? Number(limitParam) : undefined

    const posts = await searchPosts({
      query,
      limit,
    })

    return NextResponse.json(
      { posts },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search posts"

    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}