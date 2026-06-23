import { NextResponse } from "next/server"
import { getUser } from "@/modules/admin/public/get-user"
import { requireAdmin } from "@/modules/admin/public/require-admin"

type RouteParams = {
  params: Promise<{
    userId: string
  }>
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  try {
    await requireAdmin()
    const { userId } = await params
    const user = await getUser(userId)

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
