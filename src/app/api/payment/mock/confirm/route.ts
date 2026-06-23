import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorById } from "@/modules/creator/public/get-creator-by-id"
import createPayment from "@/modules/payment/public/create-payment"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"
import { logger } from "@/shared/observability/structured-logger"

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()

    const creatorId = body.creatorId as string | undefined

    if (!creatorId) {
      return NextResponse.json({ error: "Missing creatorId" }, { status: 400 })
    }

    const creator = await getCreatorById(creatorId)

    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 })
    }

    if (creator.userId === session.userId) {
      return NextResponse.json(
        { error: "You cannot subscribe to your own creator page" },
        { status: 400 }
      )
    }

   const { decision } = await canAccessCreator({
  viewerUserId: session.userId,
  creatorId: creator.id,
})

if (decision.allowed) {
  return NextResponse.json(
    { error: "You already have an active subscription" },
    { status: 400 }
  )
}

    if (!creator.subscriptionPrice || creator.subscriptionPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid subscription price" },
        { status: 400 }
      )
    }



    const payment = await createPayment({
      userId: session.userId,
      creatorId: creator.id,
      type: "subscription",
      status: "succeeded",
      amount: creator.subscriptionPrice,
      currency: creator.subscriptionCurrency,
      provider: "mock",
    })



  return NextResponse.json({
  success: true,
  payment,
  subscription: null,
})
  } catch (error) {
    logger.error({
      event: "payment.mock_confirm_route_failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to confirm mock payment" },
      { status: 500 }
    )
  }
}
