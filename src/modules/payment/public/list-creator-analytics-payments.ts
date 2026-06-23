import {
  listCreatorAnalyticsPayments as listCreatorAnalyticsPaymentsRuntime,
} from "@/modules/payment/runtime/list-creator-analytics-payments"

export const PUBLIC_CONTRACT = true

export type ListCreatorAnalyticsPaymentsInput = Parameters<
  typeof listCreatorAnalyticsPaymentsRuntime
>[0]

export type CreatorAnalyticsPaymentsResult = Awaited<
  ReturnType<typeof listCreatorAnalyticsPaymentsRuntime>
>

export type CreatorAnalyticsPaymentAmountRow =
  NonNullable<
    CreatorAnalyticsPaymentsResult["totalPaymentsResult"]["data"]
  >[number]

export type CreatorAnalyticsPaymentRow =
  NonNullable<
    CreatorAnalyticsPaymentsResult["monthlyPaymentsResult"]["data"]
  >[number]

export type PaymentAnalyticsQueryResult<T> = Omit<
  CreatorAnalyticsPaymentsResult["totalPaymentsResult"],
  "data"
> & {
  data: T[]
}

export async function listCreatorAnalyticsPayments(
  input: ListCreatorAnalyticsPaymentsInput
): Promise<CreatorAnalyticsPaymentsResult> {
  return listCreatorAnalyticsPaymentsRuntime(input)
}
