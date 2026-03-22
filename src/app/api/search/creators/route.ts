import { NextResponse } from "next/server"
import { searchCreators } from "@/modules/search/server/search-creators"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("query") ?? ""
    const limitParam = searchParams.get("limit")

    const limit = limitParam ? Number(limitParam) : undefined

    const creators = await searchCreators({
      query,
      limit,
    })

    return NextResponse.json(
      { creators },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search creators"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}