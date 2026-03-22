import { NextResponse } from "next/server"

import { approvePayoutRequest } from "@/modules/payout/server/approve-payout-request"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const payoutRequestId = body.payoutRequestId

    if (!payoutRequestId || typeof payoutRequestId !== "string") {
      return NextResponse.json(
        { error: "Invalid payoutRequestId" },
        { status: 400 }
      )
    }

    await approvePayoutRequest({ payoutRequestId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("APPROVE PAYOUT ERROR:", error)

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}