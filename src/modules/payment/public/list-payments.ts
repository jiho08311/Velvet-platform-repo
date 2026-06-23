import {
  listPayments as listPaymentsRuntime,
} from "@/modules/payment/runtime/list-payments"

export const PUBLIC_CONTRACT = true

export type AdminPaymentItem = Awaited<ReturnType<typeof listPaymentsRuntime>>[number]

export async function listPayments(): Promise<AdminPaymentItem[]> {
  return listPaymentsRuntime()
}
