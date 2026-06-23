import { NextResponse } from "next/server"
import { readCreatorDashboard } from "@/modules/analytics/public/read-creator-dashboard"
import { requireActiveSession } from "@/modules/auth/public/require-active-session"
import { readCreatorOperationalReadiness } from "@/modules/creator/public/read-creator-operational-readiness"

export async function GET() {
  try {
  const session = await requireActiveSession()

const readiness = await readCreatorOperationalReadiness({
  userId: session.userId,
})
    if (!readiness.ok) {
      return NextResponse.json(
        {
          error:
            readiness.reason === "creator_required"
              ? "Creator not found"
              : "Creator is not active",
        },
        { status: readiness.reason === "creator_required" ? 404 : 403 }
      )
    }
const analytics = await readCreatorDashboard(readiness.creator.id)

if (!analytics) {
  return NextResponse.json(
    { error: "Creator dashboard snapshot not found" },
    { status: 404 }
  )
}

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
