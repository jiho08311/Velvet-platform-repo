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
        { status: 400 }
      )
    }

    const result = await markNotificationRead(
      body.notificationId,
      user.id
    )

    return NextResponse.json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark as read"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}