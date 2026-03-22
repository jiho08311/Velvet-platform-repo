import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { unbanUser } from "@/modules/moderation/server/unban-user"

export async function POST(request: Request) {
  try {
    await requireUser()

    const body = await request.json()
    const userId = body?.userId

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    const result = await unbanUser({
      userId,
    })

    return NextResponse.json(
      { user: result },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unban user"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}