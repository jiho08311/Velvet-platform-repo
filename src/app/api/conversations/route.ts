import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { listConversations } from "@/modules/message/public/list-conversations"

export async function GET() {
  try {
   const session = await requireSession()

    const conversations = await listConversations({
      userId: session.userId,
    })

    return NextResponse.json(
      { conversations },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load conversations"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}