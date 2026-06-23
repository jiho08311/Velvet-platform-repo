import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { markNotificationRead } from "@/modules/notification/public/mark-notification-read"

type RequestBody = {
  notificationId?: string
}

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = (await request.json()) as RequestBody

    if (!body.notificationId) {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 },
      )
    }

    const notification = await markNotificationRead(
      body.notificationId,
      session.userId,
    )

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ notification }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark as read"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}