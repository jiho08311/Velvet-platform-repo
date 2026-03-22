import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorById } from "@/modules/creator/server/get-creator-by-id"
import createPayment from "@/modules/payment/server/create-payment"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { createSubscription } from "@/modules/subscription/server/create-subscription"

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

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

    if (creator.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot subscribe to your own creator page" },
        { status: 400 }
      )
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

    if (!creator.subscriptionPriceCents || creator.subscriptionPriceCents <= 0) {
      return NextResponse.json(
        { error: "Invalid subscription price" },
        { status: 400 }
      )
    }

    const currentPeriodStart = new Date()
    const currentPeriodEnd = addMonths(currentPeriodStart, 1)

    const payment = await createPayment({
      userId: user.id,
      creatorId: creator.id,
      type: "subscription",
      status: "succeeded",
      amountCents: creator.subscriptionPriceCents,
      currency: creator.subscriptionCurrency,
      provider: "mock",
    })

    const subscription = await createSubscription({
      userId: user.id,
      creatorId: creator.id,
      status: "active",
      provider: "mock",
      currentPeriodStart: currentPeriodStart.toISOString(),
      currentPeriodEnd: currentPeriodEnd.toISOString(),
    })

    return NextResponse.json({
      success: true,
      payment,
      subscription,
    })
  } catch (error) {
    console.error("mock confirm route error:", error)

    return NextResponse.json(
      { error: "Failed to confirm mock payment" },
      { status: 500 }
    )
  }
}