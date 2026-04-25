import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { confirmPayment } from "@/modules/payment/server/confirm-payment"
import { verifyPaymentAccessAfterSuccess } from "@/modules/payment/server/verify-payment-access-after-success"

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
    const user = await requireUser()

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

    const result = await confirmPayment({
      paymentId,
      paymentKey,
      orderId,
      amount,
    })

    if (!result) {
      return NextResponse.json(
        { error: "Payment not found or already processed" },
        { status: 404 }
      )
    }

    const accessVerification = await verifyPaymentAccessAfterSuccess({
      paymentId: result.id,
      viewerUserId: user.id,
    })

    return NextResponse.json({
      ok: true,
      paymentId: result.id,
      status: result.status,
      accessVerification,
    })
  } catch (error) {
    console.error("payment confirm route error:", error)

    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}
