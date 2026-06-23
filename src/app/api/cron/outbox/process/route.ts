import { NextRequest, NextResponse } from "next/server"

import {
  registerPhase5ShadowHandlers,
  runOutboxConsumerBatch,
} from "@/modules/events"
import {
  isRouteGuardError,
  requireCronSecret,
} from "@/shared/security/route-guards"
import { logger } from "@/shared/observability/structured-logger"

function parseBatchSize(request: NextRequest): number {
  const raw = request.nextUrl.searchParams.get("batchSize")
  const parsed = raw ? Number(raw) : 25

  if (!Number.isFinite(parsed)) return 25

  return Math.max(1, Math.min(50, Math.floor(parsed)))
}

async function handleOutboxProcess(request: NextRequest) {
  requireCronSecret(request)

  registerPhase5ShadowHandlers()

  const batchSize = parseBatchSize(request)

  const result = await runOutboxConsumerBatch({
    workerId: `phase-5-shadow-outbox:${crypto.randomUUID()}`,
    batchSize,
    maxAttempts: 10,
  })

  return NextResponse.json({
    ok: true,
    mode: "phase_5_shadow",
    authoritative: false,
    ...result,
  })
}

export async function POST(request: NextRequest) {
  try {
    return await handleOutboxProcess(request)
  } catch (error) {
    if (isRouteGuardError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.error({
      event: "api.cron.outbox.process.failed",
      message: "Outbox process cron route failed",
      error,
    })

    return NextResponse.json(
      { error: "Failed to process outbox" },
      { status: 500 }
    )
  }
}
