import {
  listCreatorDashboardPayments as listCreatorDashboardPaymentsRuntime,
} from "@/modules/payment/runtime/list-creator-dashboard-payments"

export const PUBLIC_CONTRACT = true

export type ListCreatorDashboardPaymentsInput = Parameters<
  typeof listCreatorDashboardPaymentsRuntime
>[0]

export type CreatorDashboardPaymentsResult = Awaited<
  ReturnType<typeof listCreatorDashboardPaymentsRuntime>
>

export async function listCreatorDashboardPayments(
  input: ListCreatorDashboardPaymentsInput
): Promise<CreatorDashboardPaymentsResult> {
  return listCreatorDashboardPaymentsRuntime(input)
}
