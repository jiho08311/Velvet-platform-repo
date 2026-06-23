import { NextResponse } from "next/server"

import { requireSession } from "@/modules/auth/public/require-session"


import {
  cancelSubscription,
  getSubscription,
} from "@/modules/commerce/public/subscription-contract"


import { notifySubscriptionCanceledWorkflow } from "@/workflows/subscription/notify-subscription-canceled-workflow"

export async function POST(req: Request) {
  const session = await requireSession()

  const body = await req.json()
  const subscriptionId = body.subscriptionId as string | undefined

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId" },
      { status: 400 }
    )
  }
const { subscription } = await getSubscription({
  subscriptionId,
})

if (!subscription || subscription.subscriberUserId !== session.userId) {
  return NextResponse.json(
    { error: "Subscription not found" },
    { status: 404 }
  )
}

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    )
  }

 const { subscription: canceledSubscription } = await cancelSubscription({
  subscriberUserId: session.userId,
  creatorId: subscription.creatorId,
  mode: "immediate",
})

await notifySubscriptionCanceledWorkflow({
  subscriptionId: canceledSubscription.subscriptionId,
  creatorId: canceledSubscription.creatorId,
  subscriberId: canceledSubscription.subscriberUserId,
  mode: "immediate",
})

  return NextResponse.json({ success: true })
}
