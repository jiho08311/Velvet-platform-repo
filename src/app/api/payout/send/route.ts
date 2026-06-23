import { NextResponse } from "next/server"

import { sendPayout } from "@/modules/commerce/public/payout-contract"
import { requireAdmin } from "@/modules/admin/public/require-admin"
import { logger } from "@/shared/observability/structured-logger"

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const body = await request.json()

    const payoutId = body.payoutId

    if (!payoutId || typeof payoutId !== "string") {
      return NextResponse.json(
        { error: "Invalid payoutId" },
        { status: 400 }
      )
    }

    const result = await sendPayout({
      payoutId,
    })

    return NextResponse.json(
      {
        success: true,
        payout: result,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({
      event: "payout.send_failed",
      error,
    })

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
