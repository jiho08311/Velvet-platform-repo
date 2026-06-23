import {
  getDashboardSubscribersReadModel as getDashboardSubscribersReadModelRuntime,
} from "@/modules/analytics/runtime/get-dashboard-subscribers-read-model"

export const PUBLIC_CONTRACT = true

export type GetDashboardSubscribersReadModelInput = Parameters<
  typeof getDashboardSubscribersReadModelRuntime
>[0]
export type DashboardSubscribersReadModel = Awaited<
  ReturnType<typeof getDashboardSubscribersReadModelRuntime>
>

export function getDashboardSubscribersReadModel(
  input: GetDashboardSubscribersReadModelInput
): ReturnType<typeof getDashboardSubscribersReadModelRuntime> {
  return getDashboardSubscribersReadModelRuntime(input)
}
