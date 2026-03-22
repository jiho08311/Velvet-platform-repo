import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { approvePayoutRequest } from "@/modules/payout/server/approve-payout-request"

type RouteParams = {
  params: Promise<{
    payoutRequestId: string
  }>
}

export async function POST(
  _request: Request,
  { params }: RouteParams
) {
  try {
    await requireUser()

    const { payoutRequestId } = await params

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