type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = Record<string, unknown>

type LogInput = {
  event: string
  message?: string
  context?: LogContext
  error?: unknown
}

function normalizeError(error: unknown): LogContext | null {
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

function writeStructuredLog(level: LogLevel, input: LogInput): void {
  const error = normalizeError(input.error)
  const payload = {
    level,
    event: input.event,
    message: input.message ?? input.event,
    context: input.context ?? {},
    error,
    timestamp: new Date().toISOString(),
  }
  const line = `${JSON.stringify(payload)}\n`

  if (level === "error" || level === "warn") {
    process.stderr.write(line)
    return
  }

  process.stdout.write(line)
}

export const logger = {
  debug(input: LogInput): void {
    writeStructuredLog("debug", input)
  },

  info(input: LogInput): void {
    writeStructuredLog("info", input)
  },

  warn(input: LogInput): void {
    writeStructuredLog("warn", input)
  },

  error(input: LogInput): void {
    writeStructuredLog("error", input)
  },
}
