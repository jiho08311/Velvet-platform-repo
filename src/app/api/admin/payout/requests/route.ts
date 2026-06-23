import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { listAdminPayoutRequests } from "@/modules/commerce/public/payout-contract"

export async function GET() {
  try {
    await requireSession()

    const payoutRequests = await listAdminPayoutRequests()

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