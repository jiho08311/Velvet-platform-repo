import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { sendMessage } from "@/modules/message/public/send-message"
import {
  createSendMessageResult,
  normalizeSendMessagePayload,
} from "@/modules/message/types"

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const payload = normalizeSendMessagePayload(body ?? {})

    if (!payload.conversationId || (!payload.content && payload.mediaIds.length === 0)) {
      return NextResponse.json(
        { error: "conversationId and content or media are required" },
        { status: 400 }
      )
    }

    const message = await sendMessage({
      ...payload,
      senderId: session.userId,
    })

    return NextResponse.json(createSendMessageResult(message), { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
