import { NextRequest, NextResponse } from "next/server"

import { sendPayout } from "@/modules/commerce/public/payout-contract"
import { requireAdmin } from "@/modules/admin/public/require-admin"
import {
  withCausationCorrelation,
  withWorkflowCorrelation,
} from "@/shared/observability/propagate-correlation-id"
import { logger } from "@/shared/observability/structured-logger"

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()

    const payoutId = body.payoutId

    if (!payoutId) {
      return NextResponse.json(
        { error: "Missing payoutId" },
        { status: 400 }
      )
    }

    const correlation = withWorkflowCorrelation(undefined, "admin-payout-send")
    const payoutCorrelation = withCausationCorrelation(correlation, payoutId)

    const result = await sendPayout({
      payoutId,
    
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error({
      event: "api.admin.payout.send.failed",
      message: "Admin payout send route failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to send payout" },
      { status: 500 }
    )
  }
}
