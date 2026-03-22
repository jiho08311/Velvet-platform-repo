import { NextResponse } from "next/server"

import { getCreatorPayoutHistory } from "@/modules/payout/server/get-creator-payout-history"

export async function GET() {
  try {
    const payouts = await getCreatorPayoutHistory()

    return NextResponse.json({
      success: true,
      data: payouts,
    })
  } catch (error) {
    console.error("GET CREATOR PAYOUTS ERROR:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch payouts",
        detail:
          error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    )
  }
}