import {
  getDashboardMainReadModel as getDashboardMainReadModelRuntime,
} from "@/modules/analytics/runtime/get-dashboard-main-read-model"

export const PUBLIC_CONTRACT = true

export type GetDashboardMainReadModelInput = Parameters<
  typeof getDashboardMainReadModelRuntime
>[0]
export type DashboardMainReadModel = Awaited<
  ReturnType<typeof getDashboardMainReadModelRuntime>
>

export function getDashboardMainReadModel(
  input: GetDashboardMainReadModelInput
): ReturnType<typeof getDashboardMainReadModelRuntime> {
  return getDashboardMainReadModelRuntime(input)
}
