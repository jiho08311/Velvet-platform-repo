import {
  getCreatorAnalyticsSummary as getCreatorAnalyticsSummaryRuntime,
} from "@/modules/analytics/runtime/get-creator-analytics"

export const PUBLIC_CONTRACT = true

export type GetCreatorAnalyticsSummaryInput = Parameters<
  typeof getCreatorAnalyticsSummaryRuntime
>[0]
export type CreatorAnalyticsSummary = Awaited<
  ReturnType<typeof getCreatorAnalyticsSummaryRuntime>
>

export function getCreatorAnalyticsSummary(
  input: GetCreatorAnalyticsSummaryInput
): ReturnType<typeof getCreatorAnalyticsSummaryRuntime> {
  return getCreatorAnalyticsSummaryRuntime(input)
}
