import { NextResponse } from "next/server"
import { requireUser } from "@/modules/auth/server/require-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createPayoutRequest } from "@/modules/payout/server/create-payout-request"
import { revalidatePayoutSurfaces } from "@/modules/payout/server/revalidate-payout-surfaces"

async function readPayoutRequestPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | { amount?: unknown; currency?: unknown }
      | null

    return {
      amount: typeof body?.amount === "number" ? body.amount : undefined,
      currency: typeof body?.currency === "string" ? body.currency : undefined,
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData()
    const rawAmount = formData.get("amount")
    const rawCurrency = formData.get("currency")

    return {
      amount:
        typeof rawAmount === "string" && rawAmount.trim()
          ? Number(rawAmount)
          : undefined,
      currency: typeof rawCurrency === "string" ? rawCurrency : undefined,
    }
  }

  return {
    amount: undefined,
    currency: undefined,
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()

    const creator = await getCreatorByUserId(user.id)

    if (!creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      )
    }

    const { amount, currency } = await readPayoutRequestPayload(request)

    const payoutRequest = await createPayoutRequest({
      creatorId: creator.id,
      amount,
      currency,
    })

    revalidatePayoutSurfaces({
      creatorUsername: creator.username,
    })

    return NextResponse.json({ payoutRequest }, { status: 200 })
  } catch (error) {
    console.error("PAYOUT REQUEST ERROR:", error)

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
