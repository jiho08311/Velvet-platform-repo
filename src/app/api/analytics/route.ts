import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { readAdminDashboard } from "@/modules/analytics/public/read-admin-dashboard"

export async function GET() {
  try {
    await requireSession()

   const analytics = await readAdminDashboard("platform")

    return NextResponse.json(
      { analytics },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}