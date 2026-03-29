type PpvMessageStateProps = {
  isLocked: boolean
  price?: number | null
  isPurchased?: boolean
}

function formatPrice(price?: number | null) {
  if (!price || price <= 0) {
    return null
  }

  return new Intl.NumberFormat("ko-KR").format(price)
}

export function PpvMessageState({
  isLocked,
  price,
  isPurchased = false,
}: PpvMessageStateProps) {
  const formattedPrice = formatPrice(price)

  if (isPurchased) {
    return (
      <div className="rounded-3xl border border-green-500/20 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-white">유료 메시지를 구매했습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          이제 메시지 내용을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  if (!isLocked) {
    return null
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
      <p className="text-sm font-medium text-white">잠긴 유료 메시지입니다</p>
      <p className="mt-1 text-sm text-zinc-400">
        {formattedPrice
          ? `${formattedPrice}원 결제 후 메시지를 열람할 수 있습니다.`
          : "결제 후 메시지를 열람할 수 있습니다."}
      </p>
    </div>
  )
}