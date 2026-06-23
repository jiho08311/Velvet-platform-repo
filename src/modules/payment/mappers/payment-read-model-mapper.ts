import {
  getPaymentStatusLabel,
  getPaymentTypeLabel,
} from "@/modules/payment/policies/payment-type-policy"
import type {
  CreatorPaymentHistoryItem,
  PaymentStatus,
  PaymentType,
} from "@/modules/payment/types"
import type {
  AdminPaymentRow,
  CreatorPaymentRow,
} from "@/modules/payment/repositories/payment-read-repository"

type AdminPaymentProfileRow = {
  id: string
  username: string | null
  display_name: string | null
}

type AdminPaymentCreatorRow = {
  id: string
  user_id: string
  username: string | null
  display_name: string | null
}

type AdminPaymentItemReadModel = {
  id: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentType: PaymentType | "unknown"
  createdAt: string
  user: {
    username: string
    displayName: string
  } | null
  creator: {
    username: string
    displayName: string
  } | null
}

type ToAdminPaymentItemInput = {
  row: AdminPaymentRow
  user: AdminPaymentProfileRow | null
  creator: AdminPaymentCreatorRow | null
}

function formatPaymentAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPaymentDate(createdAt: string) {
  return new Date(createdAt).toLocaleString()
}

export function toAdminPaymentItem({
  row,
  user,
  creator,
}: ToAdminPaymentItemInput): AdminPaymentItemReadModel {
  return {
    id: row.id,
    amount: row.amount ?? 0,
    currency: row.currency ?? "KRW",
    status: row.status,
    paymentType: row.type ?? "unknown",
    createdAt: row.created_at,
    user: user
      ? {
          username: user.username ?? "",
          displayName: user.display_name ?? user.username ?? "",
        }
      : null,
    creator: creator
      ? {
          username: creator.username ?? "",
          displayName: creator.display_name ?? creator.username ?? "",
        }
      : null,
  }
}

export function toCreatorPaymentHistoryItem(
  row: CreatorPaymentRow
): CreatorPaymentHistoryItem {
  const amount = row.amount ?? 0
  const currency = row.currency ?? "KRW"

  return {
    id: row.id,
    payerUserId: row.user_id,
    payerLabel: row.user_id ?? "Unknown customer",
    amount,
    currency,
    displayAmount: formatPaymentAmount(amount, currency),
    status: row.status,
    statusLabel: getPaymentStatusLabel(row.status),
    paymentType: row.type,
    paymentTypeLabel: getPaymentTypeLabel(row.type),
    createdAt: row.created_at,
    displayDate: formatPaymentDate(row.created_at),
  }
}