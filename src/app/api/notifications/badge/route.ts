import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { getNotificationBadgeSummary } from "@/modules/notification/public/get-notification-badge-summary"

export async function GET() {
  try {
    const session = await requireSession()

const badgeSummary = await getNotificationBadgeSummary({
  userId: session.userId,
})

    return NextResponse.json(badgeSummary, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load notification badge"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}