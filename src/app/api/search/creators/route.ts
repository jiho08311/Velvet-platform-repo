import { NextResponse } from "next/server"
import {
  readCreatorSearchApiRequest,
  resolveCreatorSearchApiResponse,
} from "@/modules/search/public/creator-search-api-contract"

export const routeAccess = "public"

export async function GET(request: Request) {
  try {
    const searchRequest = readCreatorSearchApiRequest(request)
    const response = await resolveCreatorSearchApiResponse(searchRequest)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "x-search-contract": "creator-search",
        "x-search-route-status": "active",
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search creators"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
