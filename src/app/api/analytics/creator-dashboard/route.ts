import { NextResponse } from "next/server"
import { getCreatorAnalyticsSummary } from "@/modules/analytics/server/get-creator-analytics"
import { requireActiveUser } from "@/modules/auth/server/require-active-user"
import { readCreatorOperationalReadiness } from "@/modules/creator/server/read-creator-operational-readiness"

export async function GET() {
  try {
    const user = await requireActiveUser()
    const readiness = await readCreatorOperationalReadiness({
      userId: user.id,
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

    const analytics = await getCreatorAnalyticsSummary(readiness.creator.id)

    return NextResponse.json(
      { analytics },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load creator analytics"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}
