type PaymentStateNoticeStatus =
  | "idle"
  | "pending"
  | "succeeded"
  | "failed"
  | "refunded"
  | "canceled"

type PaymentStateNoticeProps = {
  status: PaymentStateNoticeStatus
  message?: string
  variant?: "default" | "compact"
  className?: string
}

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ")
}

function getCompactNoticeClassName(status: PaymentStateNoticeStatus) {
  if (status === "succeeded") {
    return "rounded-2xl border border-green-900/60 bg-green-950/60 px-4 py-3 text-sm text-green-300"
  }

  if (status === "failed") {
    return "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  }

  if (status === "canceled") {
    return "rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700"
  }

  return "rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
}

export function PaymentStateNotice({
  status,
  message,
  variant = "default",
  className,
}: PaymentStateNoticeProps) {
  if (status === "idle") {
    return null
  }

  if (variant === "compact") {
    return (
      <div className={joinClassNames(getCompactNoticeClassName(status), className)}>
        {message}
      </div>
    )
  }

  if (status === "pending") {
    return (
      <div className={joinClassNames("rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4", className)}>
        <p className="text-sm font-medium text-white">결제를 처리 중입니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          잠시만 기다려 주세요. 결제 결과를 확인하고 있습니다.
        </p>
      </div>
    )
  }

  if (status === "succeeded") {
    return (
      <div className={joinClassNames("rounded-3xl border border-green-500/20 bg-zinc-900/70 p-4", className)}>
        <p className="text-sm font-medium text-white">결제가 완료되었습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          {message ?? "구매 또는 구독이 정상적으로 처리되었습니다."}
        </p>
      </div>
    )
  }

  if (status === "refunded") {
    return (
      <div className={joinClassNames("rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-4", className)}>
        <p className="text-sm font-medium text-white">환불이 처리되었습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          {message ?? "환불이 완료되어 해당 결제의 접근 권한이 변경될 수 있습니다."}
        </p>
      </div>
    )
  }

  if (status === "canceled") {
    return (
      <div className={joinClassNames("rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-4", className)}>
        <p className="text-sm font-medium text-white">결제가 취소되었습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          {message ?? "결제가 완료되지 않았습니다. 필요한 경우 다시 시도해 주세요."}
        </p>
      </div>
    )
  }

  return (
    <div className={joinClassNames("rounded-3xl border border-red-500/20 bg-zinc-900/70 p-4", className)}>
      <p className="text-sm font-medium text-white">결제에 실패했습니다</p>
      <p className="mt-1 text-sm text-zinc-400">
        {message ?? "결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요."}
      </p>
    </div>
  )
}