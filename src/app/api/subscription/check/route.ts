import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getViewerSubscription } from "@/modules/subscription/server/get-viewer-subscription"

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
    const user = await requireUser()

    const viewerSubscription = await getViewerSubscription(user.id, creatorId)

    const subscription = viewerSubscription.subscription
    const isEnding =
      viewerSubscription.isActive && subscription?.cancelAtPeriodEnd === true

    const state: SubscriptionCheckState = !subscription
      ? "inactive"
      : subscription.status === "expired"
        ? "expired"
        : isEnding
          ? "ending"
          : viewerSubscription.isActive
            ? "active"
            : "inactive"

    return NextResponse.json(
      {
        subscribed: viewerSubscription.isActive,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        hasAccess: viewerSubscription.isActive,
        state,
        isCancelScheduled: isEnding,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(buildEmptyResponse(), { status: 200 })
  }
}