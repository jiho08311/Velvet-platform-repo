type SubscribeButtonProps = {
  isSubscribed: boolean
  price: number
  onSubscribe?: () => void
  onManage?: () => void
}

export function SubscribeButton({
  isSubscribed,
  price,
  onSubscribe,
  onManage,
}: SubscribeButtonProps) {
  const label = isSubscribed ? "Manage subscription" : `Subscribe • $${price.toFixed(2)}/month`
  const handleClick = isSubscribed ? onManage : onSubscribe

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  )
}