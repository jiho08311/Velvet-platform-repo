import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { markNotificationRead } from "@/modules/notification/public/mark-notification-read"

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
    const session = await requireSession()

    const notification = await markNotificationRead(notificationId, session.userId)

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ notification }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mark notification as read"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}