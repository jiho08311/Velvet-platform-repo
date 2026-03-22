import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { confirmProviderPayment } from "@/modules/payment/server/confirm-provider-payment"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
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

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, type, target_type, target_id, provider")
      .eq("id", paymentId)
      .maybeSingle()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (payment.type !== "ppv_post") {
      return NextResponse.json(
        { error: "Invalid payment type" },
        { status: 400 }
      )
    }

    if (payment.target_type !== "post" || payment.target_id !== postId) {
      return NextResponse.json(
        { error: "Payment target mismatch" },
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

    return NextResponse.json({
      success: true,
      payment: result.payment,
    })
  } catch (error) {
    console.error("mock confirm post route error:", error)

    return NextResponse.json(
      { error: "Failed to confirm mock post payment" },
      { status: 500 }
    )
  }
}