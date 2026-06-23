import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { confirmPayment } from "@/modules/commerce/public/payment-contract"
import { getPaymentById } from "@/modules/commerce/public/payment-contract"
import { logger } from "@/shared/observability/structured-logger"

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()

    const { paymentId, postId } = body as {
      paymentId?: string
      postId?: string
    }

    if (!paymentId || !postId) {
      return NextResponse.json(
        { error: "Missing paymentId or postId" },
        { status: 400 }
      )
    }

const { payment } = await getPaymentById({
  paymentId,
})

    if (!payment) {
  return NextResponse.json({ error: "Payment not found" }, { status: 404 })
}

if (payment.payerUserId !== session.userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
}

if (payment.purpose !== "ppv_post") {
  return NextResponse.json(
    { error: "Invalid payment type" },
    { status: 400 }
  )
}

if (payment.target?.type !== "post" || payment.target.id !== postId) {
  return NextResponse.json(
    { error: "Payment target mismatch" },
    { status: 400 }
  )
}

const result = await confirmPayment({
  paymentId,
})
 return NextResponse.json({
  success: true,
  payment: result.payment,
})


  } catch (error) {
    logger.error({
      event: "payment.mock_confirm_post_route_failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to confirm mock post payment" },
      { status: 500 }
    )
  }
}
