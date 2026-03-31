import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { getConversationIdByMessage } from "@/modules/message/server/get-conversation-id-by-message"

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(request.url)

    const messageId = searchParams.get("messageId")

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 }
      )
    }

    const conversationId = await getConversationIdByMessage({
      messageId,
      userId: user.id,
    })

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { conversationId },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load conversation by message"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}