import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { confirmPayment } from "@/modules/payment/server/confirm-payment"

export async function POST(req: NextRequest) {
  try {
    await requireUser()

    const body = await req.json()

    // 🔥 기존 유지
    let paymentId = body.paymentId as string | undefined

    // 🔥 Toss 대응 추가 (기존 기능 절대 안 건드림)
    const paymentKey = body.paymentKey as string | undefined
    const orderId = body.orderId as string | undefined
    const amount = body.amount as number | undefined

    // 🔥 Toss일 경우 orderId를 paymentId로 사용
    if (!paymentId && orderId) {
      paymentId = orderId
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing paymentId" },
        { status: 400 }
      )
    }

    // 🔥 기존 로직 그대로 유지
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