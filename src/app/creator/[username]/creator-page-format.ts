export function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(amount)
}

export function formatCount(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0)
}
