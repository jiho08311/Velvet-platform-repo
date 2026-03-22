import { NextRequest, NextResponse } from "next/server"

import { sendPayout } from "@/modules/payout/server/send-payout"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const payoutId = body.payoutId

    if (!payoutId) {
      return NextResponse.json(
        { error: "Missing payoutId" },
        { status: 400 }
      )
    }

    const result = await sendPayout({ payoutId })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("RETRY PAYOUT ERROR:", error)

    return NextResponse.json(
      { error: "Failed to retry payout" },
      { status: 500 }
    )
  }
}