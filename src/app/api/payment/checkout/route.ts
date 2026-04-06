import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const [{ requireUser }, { getCreatorById }, { createPaymentCheckout }] =
      await Promise.all([
        import("@/modules/auth/server/require-user"),
        import("@/modules/creator/server/get-creator-by-id"),
        import("@/modules/payment/server/create-payment-checkout"),
      ])

    const user = await requireUser()
    const body = await request.json()

    const creatorId =
      typeof body?.creatorId === "string" ? body.creatorId : ""

    if (!creatorId) {
      return NextResponse.json(
        { error: "creatorId is required" },
        { status: 400 }
      )
    }

    const creator = await getCreatorById(creatorId)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    if (creator.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot subscribe to your own creator page" },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      )
    }

    const result = await createPaymentCheckout({
      userId: user.id,
      creatorId: creator.id,
      type: "subscription",
      amount: creator.subscriptionPrice,
      currency: "KRW",
      provider: "toss",
      orderId: `subscription_${creator.id}_${user.id}_${Date.now()}`,
      orderName: "크리에이터 멤버십",
      successUrl: `${appUrl}/payment/success?creatorUsername=${creator.username}`,
      failUrl: `${appUrl}/payment/fail`,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create checkout"

    return NextResponse.json({ error: message }, { status: 400 })
  }
}