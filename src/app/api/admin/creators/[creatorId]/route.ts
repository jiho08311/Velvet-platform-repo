import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreator } from "@/modules/admin/server/get-creator"

type RouteParams = {
  params: {
    creatorId: string
  }
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  try {
    await requireUser()

    const creator = await getCreator(params.creatorId)

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