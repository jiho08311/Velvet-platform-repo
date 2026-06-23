import { NextResponse } from "next/server"
import { requireSession } from "@/modules/auth/public/require-session"
import { getCreatorByUserId } from "@/modules/creator/public/get-creator-by-user-id"
import { createPayoutRequest } from "@/modules/commerce/public/payout-contract"
import { revalidatePayoutSurfaces } from "@/modules/payout/public/revalidate-payout-surfaces"
import { logger } from "@/shared/observability/structured-logger"

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
    const session = await requireSession()

    const creator = await getCreatorByUserId(session.userId)

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
    logger.error({
      event: "api.payout.request.failed",
      message: "Payout request route failed",
      error,
    })

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return NextResponse.json({ error: message }, { status: 400 })
  }
}
