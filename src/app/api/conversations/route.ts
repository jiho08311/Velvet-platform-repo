import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { listConversations } from "@/modules/message/server/list-conversations"

export async function GET() {
  try {
    const user = await requireUser()

    const conversations = await listConversations({
      userId: user.id,
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