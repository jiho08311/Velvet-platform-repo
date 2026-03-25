import { NextRequest, NextResponse } from "next/server"

import { releasePendingEarnings } from "@/modules/payout/server/release-pending-earnings"

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    throw new Error("Missing CRON_SECRET")
  }

  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${secret}`
}

async function handleRelease(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const holdDays = Number(process.env.EARNINGS_HOLD_DAYS ?? "7")
  const batchSize = Number(process.env.EARNINGS_RELEASE_BATCH_SIZE ?? "100")

  const result = await releasePendingEarnings({
    holdDays,
    limit: batchSize,
  })

  return NextResponse.json({
    ok: true,
    processedCount: result.processedCount,
    earningIds: result.earningIds,
  })
}

export async function GET(request: NextRequest) {
  try {
    return await handleRelease(request)
  } catch (error) {
    console.error("release earnings cron error:", error)

    return NextResponse.json(
      { error: "Failed to release earnings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handleRelease(request)
  } catch (error) {
    console.error("release earnings cron error:", error)

    return NextResponse.json(
      { error: "Failed to release earnings" },
      { status: 500 }
    )
  }
}