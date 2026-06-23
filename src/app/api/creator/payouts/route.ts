import { NextResponse } from "next/server"

import { getCreatorPayoutHistory } from "@/modules/commerce/public/payout-contract"
import { requireSession } from "@/modules/auth/public/require-session"
import { logger } from "@/shared/observability/structured-logger"

export async function GET() {
  try {
    await requireSession()
    const payouts = await getCreatorPayoutHistory()

    return NextResponse.json({
      success: true,
      data: payouts,
    })
  } catch (error) {
    logger.error({
      event: "creator.payouts_fetch_failed",
      error,
    })

    return NextResponse.json(
      {
        error: "Failed to fetch payouts",
        detail:
          error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    )
  }
}
