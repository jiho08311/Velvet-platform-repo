import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { confirmPayment } from "@/modules/payment/server/confirm-payment"

export async function POST(req: NextRequest) {
  try {
    await requireUser()

    const body = await req.json()

    const paymentId = body.paymentId as string | undefined

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })
    }

    const result = await confirmPayment({
      paymentId,
    })

    if (!result) {
      return NextResponse.json(
        { error: "Payment not found or already processed" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      paymentId: result.id,
      status: result.status,
    })
  } catch (error) {
    console.error("payment confirm route error:", error)

    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    )
  }
}