import {
  getDashboardPaymentsReadModel as getDashboardPaymentsReadModelRuntime,
} from "@/modules/analytics/runtime/get-dashboard-payments-read-model"

export const PUBLIC_CONTRACT = true

export type GetDashboardPaymentsReadModelInput = Parameters<
  typeof getDashboardPaymentsReadModelRuntime
>[0]
export type DashboardPaymentsReadModel = Awaited<
  ReturnType<typeof getDashboardPaymentsReadModelRuntime>
>

export function getDashboardPaymentsReadModel(
  input: GetDashboardPaymentsReadModelInput
): ReturnType<typeof getDashboardPaymentsReadModelRuntime> {
  return getDashboardPaymentsReadModelRuntime(input)
}
