import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"
import { createPaymentCheckout } from "@/modules/payment/server/create-payment-checkout"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { assertValidSubscriptionPrice } from "@/modules/subscription/lib/subscription-price"

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    const creatorId = body.creatorId as string | undefined

    if (!creatorId) {
      return NextResponse.json({ error: "Missing creatorId" }, { status: 400 })
    }

    const creator = await getCreatorById(creatorId)

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    const activeSubscription = await getActiveSubscription({
      userId: user.id,
      creatorId: creator.id,
    })

    if (activeSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      )
    }

    if (creator.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot subscribe to your own creator page" },
        { status: 400 }
      )
    }

    let price: number

    try {
      price = assertValidSubscriptionPrice(creator.subscriptionPriceCents)
    } catch {
      return NextResponse.json(
        { error: "Invalid subscription price" },
        { status: 400 }
      )
    }

    if (!creator.subscriptionCurrency) {
      return NextResponse.json(
        { error: "Missing subscription currency" },
        { status: 400 }
      )
    }

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    const result = await createPaymentCheckout({
      userId: user.id,
      creatorId: creator.id,
      type: "subscription",
      amountCents: price,
      currency: "KRW",
      provider: "toss",
      orderId: `sub_${creator.id}_${user.id}_${Date.now()}`,
      orderName: `${creator.displayName} subscription`,
      successUrl: `${appUrl}/payment/success`,
      failUrl: `${appUrl}/payment/fail`,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("payment route error:", error)

    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 }
    )
  }
}