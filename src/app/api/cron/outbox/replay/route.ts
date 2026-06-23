import { NextRequest, NextResponse } from "next/server"

import {
  registerPhase5ShadowHandlers,
  runEventReplayJob,
} from "@/modules/events"
import {
  isRouteGuardError,
  requireCronSecret,
} from "@/shared/security/route-guards"
import { logger } from "@/shared/observability/structured-logger"

function parseBatchSize(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("batchSize")
  const parsed = raw ? Number(raw) : 100

  if (!Number.isFinite(parsed)) return 100

  return Math.max(1, Math.min(500, Math.floor(parsed)))
}

async function handleReplay(request: NextRequest) {
  requireCronSecret(request)

  const replayJobId = request.nextUrl.searchParams.get("replayJobId")

  if (!replayJobId) {
    return NextResponse.json(
      { error: "Missing replayJobId" },
      { status: 400 }
    )
  }

  registerPhase5ShadowHandlers()

  const result = await runEventReplayJob({
    replayJobId,
    batchSize: parseBatchSize(request),
  })

  return NextResponse.json({
    ok: true,
    mode: "phase_5_replay",
    authoritative: false,
    ...result,
  })
}

export async function POST(request: NextRequest) {
  try {
    return await handleReplay(request)
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "cron.outbox_replay_failed",
      context: {
        replayJobId: request.nextUrl.searchParams.get("replayJobId"),
      },
      error,
    })

    return NextResponse.json(
      { error: "Failed to run event replay" },
      { status: 500 }
    )
  }
}
