import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { cancelSubscription } from "@/modules/subscription/server/cancel-subscription"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"
import { notifySubscriptionCanceledWorkflow } from "@/workflows/subscription/notify-subscription-canceled-workflow"

export async function POST(request: NextRequest) {
  const user = await requireUser()

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

  const subscription = await getActiveSubscription({
    userId: user.id,
    creatorId,
  })

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    )
  }

  const updated = await cancelSubscription({
    userId: subscription.userId,
    creatorId: subscription.creatorId,
  })

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }

  await notifySubscriptionCanceledWorkflow({
    subscriptionId: subscription.id,
    creatorId: subscription.creatorId,
    subscriberId: subscription.userId,
    mode: "period_end",
  })

  return NextResponse.json({ success: true })
}