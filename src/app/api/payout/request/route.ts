import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createPayoutRequest } from "@/modules/payout/server/create-payout-request"

export async function POST(request: Request) {
  try {
    const user = await requireUser()

    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    const body = await request.json()

    const amountCents = body.amountCents
    const currency = body.currency

    if (typeof amountCents !== "number" || !currency) {
      return NextResponse.json(
        { error: "Invalid payout request payload" },
        { status: 400 }
      )
    }

    const payoutRequest = await createPayoutRequest({
      creatorId: creator.id,
      amount: amountCents,
      currency,
    })

    return NextResponse.json({ payoutRequest }, { status: 200 })
  } catch (error) {
console.error("PAYOUT REQUEST ERROR:", error)

const message =
  error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}