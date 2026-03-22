import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { listAllPayoutRequests } from "@/modules/payout/server/list-all-payout-requests"

export async function GET() {
  try {
    await requireUser()

    const payoutRequests = await listAllPayoutRequests()

    return NextResponse.json(
      { payoutRequests },
      { status: 200 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load payout requests"

    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }
}