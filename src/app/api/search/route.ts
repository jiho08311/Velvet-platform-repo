import { NextResponse } from "next/server"
import {
  readCreatorSearchApiRequest,
  resolveCreatorSearchApiResponse,
} from "@/modules/search/server/creator-search-api-contract"

export async function GET(request: Request) {
  try {
    const searchRequest = readCreatorSearchApiRequest(request)
    const response = await resolveCreatorSearchApiResponse(searchRequest)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "x-search-contract": "creator-search",
        "x-search-route-status": "legacy-alias",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
