import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { banUser } from "@/modules/moderation/public/ban-user"

export async function POST(request: Request) {
  try {
    await requireSession()

    const body = await request.json()
    const userId = body?.userId

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    const result = await banUser({
      userId,
    })

    return NextResponse.json(
      { user: result },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to ban user"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}