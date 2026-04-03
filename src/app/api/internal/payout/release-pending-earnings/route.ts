import { NextResponse } from "next/server"
import { releasePendingEarnings } from "@/modules/payout/server/release-pending-earnings"

export async function POST() {
  try {
    const result = await releasePendingEarnings()

    return NextResponse.json({
      ok: true,
      processedCount: result.processedCount,
      earningIds: result.earningIds,
    })
  } catch (error) {
    console.error("release pending earnings route error:", error)

    return NextResponse.json(
      {
        ok: false,
        error: "FAILED_TO_RELEASE_PENDING_EARNINGS",
      },
      { status: 500 }
    )
  }
}