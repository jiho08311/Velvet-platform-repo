
import { NextResponse } from "next/server"
import { searchStoryMusic } from "@/modules/story/server/search-story-music"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("q") ?? ""
    const limitParam = searchParams.get("limit")
    const market = searchParams.get("market") ?? "KR"

    const limit = limitParam ? Number(limitParam) : undefined

    const items = await searchStoryMusic({
      query,
      limit,
      market,
    })

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}