import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"
import {
  getUnreadNotificationCount,
  hasUnreadNotifications,
} from "@/modules/notification/types"

export async function GET() {
  try {
    const user = await requireUser()

    const notifications = await listNotifications({
      userId: user.id,
    })
    const unreadCount = getUnreadNotificationCount(notifications)

    return NextResponse.json(
      {
        notifications,
        unreadCount,
        hasUnread: hasUnreadNotifications(notifications),
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notifications"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
