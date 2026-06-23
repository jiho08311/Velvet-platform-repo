import { NextRequest, NextResponse } from "next/server"

import { releasePendingEarnings } from "@/modules/commerce/public/settlement-contract"
import {
  withJobCorrelation,
  withWorkflowCorrelation,
} from "@/shared/observability/propagate-correlation-id"
import { logger } from "@/shared/observability/structured-logger"
import {
  isRouteGuardError,
  requireCronSecret,
} from "@/shared/security/route-guards"

async function handleRelease(request: NextRequest) {
  requireCronSecret(request)

  const correlation = withJobCorrelation(
    withWorkflowCorrelation(undefined, "earning-release-cron"),
    `earning-release-cron:${crypto.randomUUID()}`
  )

  const holdDays = Number(process.env.EARNINGS_HOLD_DAYS ?? "7")
  const batchSize = Number(process.env.EARNINGS_RELEASE_BATCH_SIZE ?? "100")

  const result = await releasePendingEarnings({
    holdDays,
    limit: batchSize,
  })

  return NextResponse.json({
    ok: true,
    processedCount: result.processedCount,
    earningIds: result.earningIds,
  })
}

export async function GET(request: NextRequest) {
  try {
    return await handleRelease(request)
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "cron.release_earnings_failed",
      context: { method: "GET" },
      error,
    })

    return NextResponse.json(
      { error: "Failed to release earnings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleRelease(request)
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "cron.release_earnings_failed",
      context: { method: "POST" },
      error,
    })

    return NextResponse.json(
      { error: "Failed to release earnings" },
      { status: 500 }
    )
  }
}
