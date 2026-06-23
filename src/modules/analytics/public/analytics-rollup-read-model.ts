import {
  listAnalyticsRollups as listAnalyticsRollupsRepository,
} from "@/modules/analytics/repositories/analytics-rollup-repository"

export const PUBLIC_CONTRACT = true

export type ListAnalyticsRollupsInput = Parameters<
  typeof listAnalyticsRollupsRepository
>[0]
export type AnalyticsRollupRow = Awaited<
  ReturnType<typeof listAnalyticsRollupsRepository>
>[number]

export function listAnalyticsRollups(
  input: ListAnalyticsRollupsInput
): ReturnType<typeof listAnalyticsRollupsRepository> {
  return listAnalyticsRollupsRepository(input)
}
