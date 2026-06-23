import { createAnalyticsProjectionRebuildSteps } from "./projection-analytics-rebuild-steps"
import { createContentProjectionRebuildSteps } from "./projection-content-rebuild-steps"

export type RebuildStep = {
  name: string
  run: () => Promise<Record<string, unknown>>
}

export function createProjectionRebuildSteps(input: {
  dryRun: boolean
  limit: number
}): RebuildStep[] {
  const { dryRun, limit } = input

  return [
    ...createContentProjectionRebuildSteps({ dryRun, limit }),
    ...createAnalyticsProjectionRebuildSteps({ dryRun, limit }),
  ]
}
