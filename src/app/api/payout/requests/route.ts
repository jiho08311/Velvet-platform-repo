import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { listPayoutRequests } from "@/modules/payout/server/list-payout-requests"

export async function GET() {
  try {
    const user = await requireUser()

    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    const payoutRequests = await listPayoutRequests({
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