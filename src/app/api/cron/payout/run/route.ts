import { NextRequest, NextResponse } from "next/server"

import {
  sendPayout,
  type SendPayoutResult,
} from "@/modules/commerce/public/payout-contract"
import { listCronPayoutsToRun } from "@/modules/payout/public/list-cron-payouts-to-run"
import {
  isRouteGuardError,
  requireCronSecret,
} from "@/shared/security/route-guards"
import { logger } from "@/shared/observability/structured-logger"

type PayoutCronRunResult =
  | {
      payoutId: string
      success: true
      result: SendPayoutResult
    }
  | {
      payoutId: string
      success: false
      error: string
    }

export async function GET(request: NextRequest) {
  try {
    requireCronSecret(request)
    const payouts = await listCronPayoutsToRun()

    const results: PayoutCronRunResult[] = []

    for (const payout of payouts ?? []) {
      try {
        const result = await sendPayout({
          payoutId: payout.id,
        })

        results.push({
          payoutId: payout.id,
          success: true,
          result,
        })
      } catch (error) {
        results.push({
          payoutId: payout.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "api.cron.payout.run.failed",
      message: "Payout cron route failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to run payout cron" },
      { status: 500 }
    )
  }
}
