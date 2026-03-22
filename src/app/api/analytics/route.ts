import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getPlatformAnalytics } from "@/modules/analytics/server/get-platform-analytics"

export async function GET() {
  try {
    await requireUser()

    const analytics = await getPlatformAnalytics()

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