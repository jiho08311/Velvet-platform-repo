export function formatPayoutCurrencyAmount(
  amount: number,
  currency = "KRW"
): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatPayoutHistoryAmount(
  amount: number,
  currency = "KRW"
): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPayoutAmountWithCurrencyCode(
  amount: number,
  currency: string
): string {
  return `${amount.toLocaleString()} ${currency.toUpperCase()}`
}
