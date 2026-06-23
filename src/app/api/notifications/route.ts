import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { listNotificationItems } from "@/modules/notification/public/list-notifications"

export async function GET() {
  try {
    const session = await requireSession()

    const notificationItems = await listNotificationItems({
      userId: session.userId,
    })

    return NextResponse.json(
      {
        notifications: notificationItems,
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notifications"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}