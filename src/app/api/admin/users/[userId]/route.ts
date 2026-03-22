import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getUser } from "@/modules/admin/server/get-user"

type RouteParams = {
  params: {
    userId: string
  }
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  try {
    await requireUser()

    const user = await getUser(params.userId)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { user },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user"

    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}