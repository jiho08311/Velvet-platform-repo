import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { markNotificationRead } from "@/modules/notification/server/mark-notification-read"

type RequestBody = {
  notificationId?: string
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = (await request.json()) as RequestBody

    if (!body.notificationId) {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 },
      )
    }

    const notification = await markNotificationRead(
      body.notificationId,
      user.id,
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