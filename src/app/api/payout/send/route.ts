import { NextResponse } from "next/server"

import { sendPayout } from "@/modules/payout/server/send-payout"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const payoutId = body.payoutId

    if (!payoutId || typeof payoutId !== "string") {
      return NextResponse.json(
        { error: "Invalid payoutId" },
        { status: 400 }
      )
    }

    const result = await sendPayout({ payoutId })

    return NextResponse.json(
      {
        success: true,
        payout: result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("SEND PAYOUT ERROR:", error)

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}