import { NextResponse } from "next/server"

import { approvePayoutRequest } from "@/modules/commerce/public/payout-contract"
import { requireAdmin } from "@/modules/admin/public/require-admin"
import { logger } from "@/shared/observability/structured-logger"

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()

    const payoutRequestId = body.payoutRequestId

    if (!payoutRequestId || typeof payoutRequestId !== "string") {
      return NextResponse.json(
        { error: "Invalid payoutRequestId" },
        { status: 400 }
      )
    }

    await approvePayoutRequest({ payoutRequestId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error({
      event: "payout.approve_failed",
      error,
    })

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
