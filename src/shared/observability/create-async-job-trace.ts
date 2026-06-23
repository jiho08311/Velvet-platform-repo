import { logger } from "@/shared/observability/structured-logger"

type AsyncJobTraceInput = Record<string, unknown>

export function createAsyncJobTrace(input: AsyncJobTraceInput) {
  return {
    ...input,
    tracedAt: new Date().toISOString(),
  }
}

export function createAndTraceAsyncJob(input: AsyncJobTraceInput) {
  const trace = createAsyncJobTrace(input)
  logger.info({
    event: "observability.async_job_trace",
    context: { trace },
  })
  return trace
}

export function createAsyncJobStartedTrace(input: AsyncJobTraceInput) {
  return createAsyncJobTrace({ ...input, status: "started" })
}

export function createAsyncJobCompletedTrace(input: AsyncJobTraceInput) {
  return createAsyncJobTrace({ ...input, status: "completed" })
}

export function createAsyncJobFailedTrace(input: AsyncJobTraceInput) {
  return createAsyncJobTrace({ ...input, status: "failed" })
}
