import { listLedgerPaymentAnalyticsAmountRows } from "@/modules/ledger/public/payment-analytics-read-model"
import {
  listLedgerCreatorAnalyticsMonthlyPaymentRows,
  listLedgerCreatorAnalyticsTotalPaymentRows,
  listLedgerCreatorDashboardPaymentRows,
} from "@/modules/ledger/public/payment-analytics-read-model"

import type {
  CreatorAnalyticsPaymentAmountRow,
  CreatorAnalyticsPaymentRow,
  CreatorDashboardPaymentRow,
  ListCreatorAnalyticsMonthlyPaymentRowsInput,
  ListCreatorDashboardPaymentRowsInput,
  PaymentAnalyticsAmountRow,
  PaymentAnalyticsQueryResult,
} from "./payment-read-repository-types"

export async function listCreatorAnalyticsTotalPaymentRows(
  creatorId: string
): Promise<PaymentAnalyticsQueryResult<CreatorAnalyticsPaymentAmountRow>> {
  try {
    const data = await listLedgerCreatorAnalyticsTotalPaymentRows(creatorId)

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}

export async function listCreatorAnalyticsMonthlyPaymentRows({
  creatorId,
  periodStart,
}: ListCreatorAnalyticsMonthlyPaymentRowsInput): Promise<
  PaymentAnalyticsQueryResult<CreatorAnalyticsPaymentRow>
> {
  try {
    const data = await listLedgerCreatorAnalyticsMonthlyPaymentRows({
      creatorId,
      periodStart,
    })

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}

export async function listAdminPaymentAnalyticsRows(): Promise<
  PaymentAnalyticsQueryResult<PaymentAnalyticsAmountRow>
> {
  try {
    const data = await listLedgerPaymentAnalyticsAmountRows()

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}

export async function listPlatformPaymentAnalyticsRows(): Promise<
  PaymentAnalyticsQueryResult<PaymentAnalyticsAmountRow>
> {
  try {
    const data = await listLedgerPaymentAnalyticsAmountRows()

    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}

export async function listCreatorDashboardPaymentRows({
  creatorId,
  monthStart,
}: ListCreatorDashboardPaymentRowsInput): Promise<{
  monthlyPayments: CreatorDashboardPaymentRow[] | null
  totalPayments: CreatorDashboardPaymentRow[] | null
  monthlyError: unknown
  totalError: unknown
}> {
  try {
    const result = await listLedgerCreatorDashboardPaymentRows({
      creatorId,
      monthStart,
    })

    return {
      monthlyPayments: result.monthlyPayments,
      totalPayments: result.totalPayments,
      monthlyError: null,
      totalError: null,
    }
  } catch (error) {
    return {
      monthlyPayments: null,
      totalPayments: null,
      monthlyError: error,
      totalError: error,
    }
  }
}
