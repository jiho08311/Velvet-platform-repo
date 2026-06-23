import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { approvePayoutRequest } from "@/modules/commerce/public/payout-contract"

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ payoutRequestId: string }> }
) {
  try {
await requireSession()

    const { payoutRequestId } = await context.params

    if (!payoutRequestId) {
      return NextResponse.json(
        { error: "Missing payoutRequestId" },
        { status: 400 }
      )
    }

    await approvePayoutRequest({
      payoutRequestId,
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to approve payout request"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}