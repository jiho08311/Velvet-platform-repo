import { NextResponse } from "next/server"

import { getSession } from "@/modules/auth/server/get-session"
import { sendMessage } from "@/modules/message/server/send-message"

type RouteContext = {
  params: Promise<{
    conversationId: string
  }>
}

function getSessionUserId(session: unknown) {
  if (!session || typeof session !== "object") return null

  if ("userId" in session && typeof session.userId === "string") {
    return session.userId
  }

  if (
    "user" in session &&
    session.user &&
    typeof session.user === "object" &&
    "id" in session.user &&
    typeof session.user.id === "string"
  ) {
    return session.user.id
  }

  return null
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession()
  const userId = getSessionUserId(session)

  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url), 303)
  }

  const { conversationId } = await context.params
  const formData = await request.formData()
  const content = String(formData.get("content") || "").trim()

  if (!content) {
    return NextResponse.redirect(
      new URL(`/messages/${conversationId}`, request.url),
      303
    )
  }

  await sendMessage({
    conversationId,
    senderId: userId,
    content,
  })

  return NextResponse.redirect(
    new URL(`/messages/${conversationId}`, request.url),
    303
  )
}