import { NextResponse } from "next/server"
import { releasePendingEarnings } from "@/modules/commerce/public/settlement-contract"
import {
  isRouteGuardError,
  requireInternalJobSecret,
} from "@/shared/security/route-guards"
import { logger } from "@/shared/observability/structured-logger"

export async function POST(request: Request) {
  try {
    requireInternalJobSecret(request)
    const result = await releasePendingEarnings()

    return NextResponse.json({
      ok: true,
      processedCount: result.processedCount,
      earningIds: result.earningIds,
    })
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "internal.payout.release_pending_earnings_failed",
      error,
    })

    return NextResponse.json(
      {
        ok: false,
        error: "FAILED_TO_RELEASE_PENDING_EARNINGS",
      },
      { status: 500 }
    )
  }
}
