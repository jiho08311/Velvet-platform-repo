import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { getCreatorAnalytics } from "@/modules/analytics/server/get-creator-analytics"

export async function GET() {
  try {
    const user = await requireUser()

    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    const analytics = await getCreatorAnalytics(creator.id)

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