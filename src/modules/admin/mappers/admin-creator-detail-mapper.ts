export type AdminUserCreatorDetailRow = {
  id: string
  status: string
  subscription_price: number
}

export type AdminUserCreatorDetailModel = {
  id: string
  status: string
  subscriptionPrice: number
  subscriptionPriceLabel: string
}

function formatCreatorSubscriptionPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price)
}

export function buildAdminUserCreatorDetailModel(
  row: AdminUserCreatorDetailRow
): AdminUserCreatorDetailModel {
  return {
    id: row.id,
    status: row.status,
    subscriptionPrice: row.subscription_price,
    subscriptionPriceLabel: formatCreatorSubscriptionPrice(
      row.subscription_price
    ),
  }
}