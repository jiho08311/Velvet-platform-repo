import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { deleteNotification } from "@/modules/notification/public/delete-notification"

type DeleteNotificationRouteParams = {
  params: Promise<{
    notificationId: string
  }>
}

export async function POST(
  _request: Request,
  { params }: DeleteNotificationRouteParams,
) {
  try {
    const { notificationId } = await params
    const session = await requireSession()

    const deleted = await deleteNotification({
      notificationId,
      userId: session.userId,
    })

    if (!deleted) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete notification"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}