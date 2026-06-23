import {
  finishProjectionRebuildRun,
  recordProjectionHealthCheck,
  startProjectionRebuildRun,
} from "@/modules/projection/repositories/projection-ops-repository"
import {
  createProjectionRebuildSteps,
  type RebuildStep,
} from "./projection-rebuild-step-registry"

async function runStep(step: RebuildStep, dryRun: boolean) {
  const startedAt = Date.now()
  const runId = await startProjectionRebuildRun({
    projectionName: step.name,
    dryRun,
  })

  try {
    const result = await step.run()
    const durationMs = Date.now() - startedAt

    await finishProjectionRebuildRun({
      runId,
      status: "succeeded",
      result,
    })

    await recordProjectionHealthCheck({
      projectionName: step.name,
      projectionLag: 0,
      projectionDrift: 0,
      rebuildDurationMs: durationMs,
      status: "rebuild_succeeded",
      metadata: {
        dryRun,
        result,
      },
    })

    return {
      projectionName: step.name,
      status: "succeeded" as const,
      durationMs,
      result,
    }
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const errorMessage =
      error instanceof Error ? error.message : "Unknown projection rebuild error"

    await finishProjectionRebuildRun({
      runId,
      status: "failed",
      errorMessage,
    })

    await recordProjectionHealthCheck({
      projectionName: step.name,
      projectionLag: 0,
      projectionDrift: 1,
      rebuildDurationMs: durationMs,
      status: "rebuild_failed",
      metadata: {
        dryRun,
        errorMessage,
      },
    })

    return {
      projectionName: step.name,
      status: "failed" as const,
      durationMs,
      errorMessage,
    }
  }
}

export async function rebuildAllProjections(input?: {
  dryRun?: boolean
  limit?: number
}) {
  const dryRun = input?.dryRun ?? false
  const limit = input?.limit ?? 5000

  const steps = createProjectionRebuildSteps({ dryRun, limit })

  const results = []

  for (const step of steps) {
    results.push(await runStep(step, dryRun))
  }

  return {
    dryRun,
    limit,
    results,
    failedCount: results.filter((result) => result.status === "failed").length,
  }
}
