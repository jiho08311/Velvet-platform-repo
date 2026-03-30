import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { listNotifications } from "@/modules/notification/server/list-notifications"

export async function GET() {
  try {
    const user = await requireUser()

    const notifications = await listNotifications({
      userId: user.id,
    })

    return NextResponse.json(
      {
        notifications,
      },
      { status: 200 },
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notifications"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}