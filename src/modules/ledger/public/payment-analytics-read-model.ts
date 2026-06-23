import {
  listLedgerCreatorAnalyticsMonthlyPaymentRows as listLedgerCreatorAnalyticsMonthlyPaymentRowsRepository,
  listLedgerCreatorAnalyticsTotalPaymentRows as listLedgerCreatorAnalyticsTotalPaymentRowsRepository,
  listLedgerCreatorDashboardPaymentRows as listLedgerCreatorDashboardPaymentRowsRepository,
} from "@/modules/ledger/repositories/ledger-creator-payment-analytics-repository"
import {
  listLedgerPaymentAnalyticsAmountRows as listLedgerPaymentAnalyticsAmountRowsRepository,
} from "@/modules/ledger/repositories/ledger-payment-analytics-repository"

export const PUBLIC_CONTRACT = true

export type LedgerCreatorAnalyticsAmountRow = Awaited<
  ReturnType<typeof listLedgerCreatorAnalyticsTotalPaymentRowsRepository>
>[number]
export type LedgerCreatorAnalyticsPaymentRow = Awaited<
  ReturnType<typeof listLedgerCreatorAnalyticsMonthlyPaymentRowsRepository>
>[number]
export type LedgerCreatorDashboardPaymentRow = Awaited<
  ReturnType<typeof listLedgerCreatorDashboardPaymentRowsRepository>
>["monthlyPayments"][number]
export type LedgerPaymentAnalyticsAmountRow = Awaited<
  ReturnType<typeof listLedgerPaymentAnalyticsAmountRowsRepository>
>[number]
export type ListLedgerCreatorAnalyticsMonthlyPaymentRowsInput = Parameters<
  typeof listLedgerCreatorAnalyticsMonthlyPaymentRowsRepository
>[0]
export type ListLedgerCreatorDashboardPaymentRowsInput = Parameters<
  typeof listLedgerCreatorDashboardPaymentRowsRepository
>[0]

export async function listLedgerCreatorAnalyticsTotalPaymentRows(
  creatorId: string
): Promise<LedgerCreatorAnalyticsAmountRow[]> {
  return listLedgerCreatorAnalyticsTotalPaymentRowsRepository(creatorId)
}

export async function listLedgerCreatorAnalyticsMonthlyPaymentRows(
  input: ListLedgerCreatorAnalyticsMonthlyPaymentRowsInput
): Promise<LedgerCreatorAnalyticsPaymentRow[]> {
  return listLedgerCreatorAnalyticsMonthlyPaymentRowsRepository(input)
}

export async function listLedgerCreatorDashboardPaymentRows(
  input: ListLedgerCreatorDashboardPaymentRowsInput
): ReturnType<typeof listLedgerCreatorDashboardPaymentRowsRepository> {
  return listLedgerCreatorDashboardPaymentRowsRepository(input)
}

export async function listLedgerPaymentAnalyticsAmountRows(): Promise<
  LedgerPaymentAnalyticsAmountRow[]
> {
  return listLedgerPaymentAnalyticsAmountRowsRepository()
}
