import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { listCreatorPayoutRequests } from "@/modules/commerce/public/payout-contract"

export async function GET() {
  try {
   const session = await requireSession()

    const creator = await getCreatorByUserId(session.userId)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

 const payoutRequests = await listCreatorPayoutRequests({
  creatorId: creator.id,
})

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