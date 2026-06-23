import { NextRequest, NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"
import { cancelSubscription } from "@/modules/commerce/public/subscription-contract"
import { notifySubscriptionCanceledWorkflow } from "@/workflows/subscription/notify-subscription-canceled-workflow"

export async function POST(request: NextRequest) {
  const session = await requireSession()

  let body: { creatorId?: string } = {}

  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const creatorId = body.creatorId?.trim()

  if (!creatorId) {
    return NextResponse.json(
      { error: "creatorId is required" },
      { status: 400 }
    )
  }
const { subscription } = await cancelSubscription({
  subscriberUserId: session.userId,
  creatorId,
  mode: "period_end",
})




await notifySubscriptionCanceledWorkflow({
  subscriptionId: subscription.subscriptionId,
  creatorId: subscription.creatorId,
  subscriberId: subscription.subscriberUserId,
  mode: "period_end",
})

  return NextResponse.json({ success: true })
}