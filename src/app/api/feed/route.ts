import { NextResponse } from "next/server"
import { getSession } from "@/modules/auth/server/get-session"
import { getHomeFeed } from "@/modules/feed/server/get-home-feed"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limitParam = searchParams.get("limit")

    const limit = limitParam ? Number(limitParam) : 10
    const session = await getSession()

    const feed = await getHomeFeed({
      viewerUserId: session?.userId ?? "",
      limit,
      cursor,
    })

    return NextResponse.json(feed, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load feed"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}