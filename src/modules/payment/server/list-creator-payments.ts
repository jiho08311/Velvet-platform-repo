import { createSupabaseServerClient } from "@/infrastructure/supabase/server"
import type {
  CreatorPaymentHistoryItem,
  PaymentStatus,
  PaymentType,
} from "@/modules/payment/types"

type ListCreatorPaymentsParams = {
  creatorId: string
}

type CreatorPaymentRow = {
  id: string
  amount: number | null
  currency: string | null
  user_id: string | null
  status: PaymentStatus
  type: PaymentType
  created_at: string
}

const paymentTypeLabels: Record<PaymentType, string> = {
  subscription: "Subscription",
  tip: "Tip",
  ppv_post: "Post purchase",
  ppv_message: "Message purchase",
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "Pending",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
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

function toCreatorPaymentHistoryItem(
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
    statusLabel: paymentStatusLabels[row.status],
    paymentType: row.type,
    paymentTypeLabel: paymentTypeLabels[row.type],
    createdAt: row.created_at,
    displayDate: formatPaymentDate(row.created_at),
  }
}

export async function listCreatorPayments({
  creatorId,
}: ListCreatorPaymentsParams): Promise<CreatorPaymentHistoryItem[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, currency, user_id, status, type, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .returns<CreatorPaymentRow[]>()

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(toCreatorPaymentHistoryItem)
}
