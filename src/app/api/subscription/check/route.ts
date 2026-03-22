import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getActiveSubscription } from "@/modules/subscription/server/get-active-subscription"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const creatorId = searchParams.get("creatorId")

  if (!creatorId) {
    return NextResponse.json(
      { subscribed: false, cancelAtPeriodEnd: false },
      { status: 200 }
    )
  }

  try {
    const user = await requireUser()

    const subscription = await getActiveSubscription({
      userId: user.id,
      creatorId,
    })

    return NextResponse.json(
      {
        subscribed: Boolean(subscription),
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { subscribed: false, cancelAtPeriodEnd: false },
      { status: 200 }
    )
  }
}