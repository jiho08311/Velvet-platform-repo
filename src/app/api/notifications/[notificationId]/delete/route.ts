import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { deleteNotification } from "@/modules/notification/server/delete-notification"

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
    const user = await requireUser()

    await deleteNotification({
      notificationId,
      userId: user.id,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete notification"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}