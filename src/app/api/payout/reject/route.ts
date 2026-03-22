import { NextResponse } from "next/server"

import { rejectPayoutRequest } from "@/modules/payout/server/reject-payout-request"

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

    await rejectPayoutRequest({ payoutRequestId })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("REJECT PAYOUT ERROR:", error)

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}