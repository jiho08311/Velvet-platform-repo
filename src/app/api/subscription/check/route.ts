import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { canAccessCreator } from "@/modules/commerce/public/entitlement-contract"

type SubscriptionCheckState = "active" | "ending" | "expired" | "inactive"

function buildEmptyResponse() {
  return {
    subscribed: false,
    cancelAtPeriodEnd: false,
    hasAccess: false,
    state: "inactive" as SubscriptionCheckState,
    isCancelScheduled: false,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const creatorId = searchParams.get("creatorId")

  if (!creatorId) {
    return NextResponse.json(buildEmptyResponse(), { status: 200 })
  }

  try {
 const session = await requireSession()

const { decision } = await canAccessCreator({
  viewerUserId: session.userId,
  creatorId,
})

const state: SubscriptionCheckState = decision.allowed
  ? decision.reason === "ending_subscription"
    ? "ending"
    : "active"
  : "inactive"

return NextResponse.json(
  {
    subscribed: decision.allowed,
    cancelAtPeriodEnd: decision.reason === "ending_subscription",
    hasAccess: decision.allowed,
    state,
    isCancelScheduled: decision.reason === "ending_subscription",
  },
  { status: 200 }
)
  } catch {
    return NextResponse.json(buildEmptyResponse(), { status: 200 })
  }
}