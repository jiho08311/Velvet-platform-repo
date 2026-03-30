import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { createClient } from "@/infrastructure/supabase/server"

import { unsubscribe } from "@/modules/subscription/server/unsubscribe"
import { notifySubscriptionCanceledWorkflow } from "@/workflows/subscription/notify-subscription-canceled-workflow"

export async function POST(req: Request) {
  const user = await requireUser()
  const supabase = await createClient()

  const body = await req.json()
  const subscriptionId = body.subscriptionId as string | undefined

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId" },
      { status: 400 }
    )
  }

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, creator_id")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .single()

  if (error || !subscription) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    )
  }

  const updated = await unsubscribe(subscription.id)

  if (!updated) {
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    )
  }

  await notifySubscriptionCanceledWorkflow({
    subscriptionId: subscription.id,
    creatorId: subscription.creator_id,
    subscriberId: subscription.user_id,
    mode: "immediate",
  })

  return NextResponse.json({ success: true })
}