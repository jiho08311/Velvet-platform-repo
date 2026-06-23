import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { getConversationIdByMessage } from "@/modules/message/public/get-conversation-id-by-message"

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession()
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
      userId: session.userId,
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