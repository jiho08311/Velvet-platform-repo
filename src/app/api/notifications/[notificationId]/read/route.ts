import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { markNotificationRead } from "@/modules/notification/server/mark-notification-read"

type MarkNotificationReadRouteParams = {
  params: Promise<{
    notificationId: string
  }>
}

export async function POST(
  _request: Request,
  { params }: MarkNotificationReadRouteParams,
) {
  try {
    const { notificationId } = await params
    const user = await requireUser()

    const notification = await markNotificationRead(notificationId, user.id)

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ notification }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark notification as read"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}