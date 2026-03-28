import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPaymentCheckout } from "@/modules/payment/server/create-payment-checkout"
import { assertValidMessagePrice } from "@/modules/message/lib/message-price"

type PurchaseRequestBody = {
  messageId?: string
}

type MessageRow = {
  id: string
  sender_id: string
  conversation_id: string
  type: string | null
  price: number | null
}

type ParticipantRow = {
  user_id: string
}

type CreatorRow = {
  id: string
  user_id: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PurchaseRequestBody
    const messageId = body.messageId

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const user = await requireUser()

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, conversation_id, type, price")
      .eq("id", messageId)
      .maybeSingle<MessageRow>()

    if (messageError || !message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    if (message.type !== "ppv") {
      return NextResponse.json(
        { error: "Message is not a PPV message" },
        { status: 400 }
      )
    }

    let validatedPrice: number

    try {
      validatedPrice = assertValidMessagePrice(message.price ?? 0)
    } catch {
      return NextResponse.json(
        { error: "Invalid message price" },
        { status: 400 }
      )
    }

    const { data: participants, error: participantsError } = await supabaseAdmin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", message.conversation_id)

    if (participantsError) {
      throw participantsError
    }

    const participantRows = (participants ?? []) as ParticipantRow[]
    const participantUserIds = participantRows.map((row) => row.user_id)

    if (!participantUserIds.includes(user.id)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    if (message.sender_id === user.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own PPV message" },
        { status: 400 }
      )
    }

    const { data: creator, error: creatorError } = await supabaseAdmin
      .from("creators")
      .select("id, user_id")
      .eq("user_id", message.sender_id)
      .maybeSingle<CreatorRow>()

    if (creatorError || !creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const { data: existingPayment, error: existingPaymentError } =
      await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("target_type", "message")
        .eq("target_id", message.id)
        .eq("status", "succeeded")
        .maybeSingle()

    if (existingPaymentError) {
      throw existingPaymentError
    }

    if (existingPayment) {
      return NextResponse.json(
        { error: "MESSAGE_ALREADY_PURCHASED" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      )
    }

    const result = await createPaymentCheckout({
      userId: user.id,
      creatorId: creator.id,
      type: "ppv_message",
      amountCents: validatedPrice,
      provider: "toss",
      targetType: "message",
      targetId: message.id,
      orderId: `ppv_message_${message.id}_${user.id}_${Date.now()}`,
      orderName: "Message purchase",
      successUrl: `${appUrl}/payment/success?messageId=${message.id}`,
      failUrl: `${appUrl}/payment/fail`,
    })

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create message purchase request"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}