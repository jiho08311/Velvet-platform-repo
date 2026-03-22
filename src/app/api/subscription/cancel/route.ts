import { NextResponse } from "next/server"

import { requireUser } from "@/modules/auth/server/require-user"
import { createClient } from "@/infrastructure/supabase/server"

export async function POST() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .single()

  if (error || !subscription) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscription.id)

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}