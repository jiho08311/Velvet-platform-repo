import { NextResponse } from "next/server"
import { getCreator } from "@/modules/admin/server/get-creator"

type RouteParams = {
  params: Promise<{
    creatorId: string
  }>
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  try {
    const { creatorId } = await params
    const creator = await getCreator(creatorId)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { creator },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creator"

    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}