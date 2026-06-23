import { NextRequest, NextResponse } from "next/server"

import { logger } from "@/shared/observability/structured-logger"

export const routeAccess = "public"

type ClientEventPayload = {
  level?: unknown
  event?: unknown
  message?: unknown
  context?: unknown
  error?: unknown
  url?: unknown
  timestamp?: unknown
}

const ALLOWED_CLIENT_EVENTS = new Set([
  "payment.success_confirmation_failed",
  "post.purchase_flow_failed",
])

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asShortString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback
  }

  return value.slice(0, 300)
}

function normalizePayload(payload: ClientEventPayload) {
  const event = asShortString(payload.event)

  if (!ALLOWED_CLIENT_EVENTS.has(event)) {
    return null
  }

  const level = payload.level === "error" ? "error" : "warn"

  return {
    level,
    event,
    message: asShortString(payload.message, event),
    context: {
      ...asRecord(payload.context),
      clientUrl: asShortString(payload.url),
      clientTimestamp: asShortString(payload.timestamp),
    },
    error: asRecord(payload.error),
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = normalizePayload((await req.json()) as ClientEventPayload)

    if (payload) {
      const log = {
        event: payload.event,
        message: payload.message,
        context: payload.context,
        error: payload.error,
      }

      if (payload.level === "error") {
        logger.error(log)
      } else {
        logger.warn(log)
      }
    }
  } catch (error) {
    logger.warn({
      event: "observability.client_event_ingest_failed",
      error,
    })
  }

  return NextResponse.json({ ok: true })
}
