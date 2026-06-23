"use client"

type ClientLogLevel = "warn" | "error"

type ClientLogContext = Record<string, unknown>

type ClientLogInput = {
  event: string
  message?: string
  context?: ClientLogContext
  error?: unknown
}

function normalizeClientError(error: unknown): ClientLogContext | null {
  if (!error) {
    return null
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    value: String(error),
  }
}

function emitClientLog(level: ClientLogLevel, input: ClientLogInput): void {
  if (typeof window === "undefined") {
    return
  }

  const payload = JSON.stringify({
    level,
    event: input.event,
    message: input.message ?? input.event,
    context: input.context ?? {},
    error: normalizeClientError(input.error),
    url: window.location.href,
    timestamp: new Date().toISOString(),
  })

  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon(
      "/api/observability/client-events",
      new Blob([payload], { type: "application/json" })
    )

    if (sent) {
      return
    }
  }

  void fetch("/api/observability/client-events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Client observability must never break the user flow.
  })
}

export const clientLogger = {
  warn(input: ClientLogInput): void {
    emitClientLog("warn", input)
  },

  error(input: ClientLogInput): void {
    emitClientLog("error", input)
  },
}
