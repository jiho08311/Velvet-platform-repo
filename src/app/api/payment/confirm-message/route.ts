import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { confirmProviderPayment } from "@/modules/payment/server/confirm-provider-payment"

type ConfirmMessageRequestBody = {
  paymentId?: string
  messageId?: string
}

type PaymentRow = {
  id: string
  user_id: string
  type: string | null
  target_type: string | null
  target_id: string | null
  provider: "toss" | "mock"
}

type MessageRow = {
  id: string
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = (await request.json()) as ConfirmMessageRequestBody

    const paymentId = body.paymentId
    const messageId = body.messageId

    if (!paymentId || !messageId) {
      return NextResponse.json(
        { error: "paymentId and messageId are required" },
        { status: 400 }
      )
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .maybeSingle<MessageRow>()

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, type, target_type, target_id, provider")
      .eq("id", paymentId)
      .maybeSingle<PaymentRow>()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.user_id !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    if (payment.type !== "ppv_message") {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      )
    }

    if (payment.target_type !== "message" || payment.target_id !== messageId) {
      return NextResponse.json(
        { error: "Payment does not match message" },
        { status: 400 }
      )
    }

    const result = await confirmProviderPayment({
      paymentId,
      provider: payment.provider,
    })

    if (result.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment confirmation failed" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        payment: result.payment,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("confirm message route error:", error)

    return NextResponse.json(
      { error: "Failed to confirm message payment" },
      { status: 500 }
    )
  }
}