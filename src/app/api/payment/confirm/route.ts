import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { confirmPayment } from "@/modules/commerce/public/payment-contract"
import { logger } from "@/shared/observability/structured-logger"

function parseAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()

    let paymentId = body.paymentId as string | undefined
    const paymentKey = body.paymentKey as string | undefined
    const orderId = body.orderId as string | undefined
    const amount = parseAmount(body.amount)

    if (!paymentId && orderId) {
      paymentId = orderId
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing paymentId" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number") {
      return NextResponse.json(
        { error: "Missing amount" },
        { status: 400 }
      )
    }

const result = await confirmPayment({
  paymentId,
  paymentKey,
  orderId,
  amount,
})

return NextResponse.json({
  ok: true,
  paymentId: result.payment.paymentId,
  status: "succeeded",
  accessVerification: {
    allowed: result.payment.status === "succeeded",
    source: result.payment.purpose,
    target: result.payment.target,
  },
})
  } catch (error) {
    logger.error({
      event: "api.payment.confirm.failed",
      message: "Payment confirmation route failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}
