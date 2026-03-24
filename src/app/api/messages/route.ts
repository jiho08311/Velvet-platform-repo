import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { sendMessage } from "@/modules/message/server/send-message"

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()

    const conversationId = body?.conversationId
    const content = body?.content
    const type = body?.type === "ppv" ? "ppv" : "text"
    const price =
      body?.price === null || body?.price === undefined || body?.price === ""
        ? null
        : Number(body.price)

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      )
    }

    const message = await sendMessage({
      conversationId,
      senderId: user.id,
      content,
      type,
      price,
    })

    return NextResponse.json({ message }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}