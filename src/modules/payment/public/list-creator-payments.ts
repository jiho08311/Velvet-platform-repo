import {
  listCreatorPayments as listCreatorPaymentsRuntime,
} from "@/modules/payment/runtime/list-creator-payments"

export const PUBLIC_CONTRACT = true

export type ListCreatorPaymentsInput = Parameters<
  typeof listCreatorPaymentsRuntime
>[0]

export type CreatorPaymentHistoryItem = Awaited<
  ReturnType<typeof listCreatorPaymentsRuntime>
>[number]

export async function listCreatorPayments(
  input: ListCreatorPaymentsInput
): Promise<CreatorPaymentHistoryItem[]> {
  return listCreatorPaymentsRuntime(input)
}
