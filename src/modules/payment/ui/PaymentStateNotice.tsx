type PaymentStateNoticeProps = {
  status: "idle" | "pending" | "succeeded" | "failed" | "refunded"
  message?: string
}

export function PaymentStateNotice({
  status,
  message,
}: PaymentStateNoticeProps) {
  if (status === "idle") {
    return null
  }

  if (status === "pending") {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-white">결제를 처리 중입니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          잠시만 기다려 주세요. 결제 결과를 확인하고 있습니다.
        </p>
      </div>
    )
  }

  if (status === "succeeded") {
    return (
      <div className="rounded-3xl border border-green-500/20 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-white">결제가 완료되었습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          {message ?? "구매 또는 구독이 정상적으로 처리되었습니다."}
        </p>
      </div>
    )
  }

  if (status === "refunded") {
    return (
      <div className="rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-4">
        <p className="text-sm font-medium text-white">환불이 처리되었습니다</p>
        <p className="mt-1 text-sm text-zinc-400">
          {message ?? "환불이 완료되어 해당 결제의 접근 권한이 변경될 수 있습니다."}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-4">
      <p className="text-sm font-medium text-white">결제에 실패했습니다</p>
      <p className="mt-1 text-sm text-zinc-400">
        {message ?? "결제 처리 중 문제가 발생했습니다. 다시 시도해 주세요."}
      </p>
    </div>
  )
}