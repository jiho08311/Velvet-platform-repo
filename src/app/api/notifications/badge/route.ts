import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { listNotificationReadStates } from "@/modules/notification/server/list-notifications"
import { buildNotificationBadgeSummary } from "@/modules/notification/types"

export async function GET() {
  try {
    const user = await requireUser()

 const readStates = await listNotificationReadStates({
  userId: user.id,
})

const badgeSummary = buildNotificationBadgeSummary(readStates)

    return NextResponse.json(badgeSummary, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load notification badge"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}