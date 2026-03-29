type SubscriptionStatusCardProps = {
  status: "active" | "canceled" | "expired" | "inactive"
  currentPeriodEndAt?: string | null
  cancelAtPeriodEnd?: boolean
}

function formatDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export function SubscriptionStatusCard({
  status,
  currentPeriodEndAt,
  cancelAtPeriodEnd = false,
}: SubscriptionStatusCardProps) {
  const formattedEndDate = formatDate(currentPeriodEndAt)

  if (status === "inactive") {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">구독 중이 아닙니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          이 크리에이터의 구독 콘텐츠와 메시지 기능을 이용하려면 구독이 필요합니다.
        </p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">구독이 만료되었습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}에 구독이 종료되었습니다. 다시 구독하면 접근 권한이 복구됩니다.`
            : "구독 기간이 종료되었습니다. 다시 구독하면 접근 권한이 복구됩니다."}
        </p>
      </div>
    )
  }

  if (status === "canceled" || cancelAtPeriodEnd) {
    return (
      <div className="rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">구독 해지가 예약되었습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}까지는 구독 혜택을 계속 사용할 수 있습니다.`
            : "현재 결제 주기 종료 시 구독이 종료됩니다."}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-green-500/20 bg-zinc-900/70 p-5">
      <p className="text-sm font-medium text-white">구독이 활성화되어 있습니다</p>
      <p className="mt-2 text-sm text-zinc-400">
        {formattedEndDate
          ? `다음 갱신 기준일은 ${formattedEndDate}입니다.`
          : "현재 구독이 활성 상태입니다."}
      </p>
    </div>
  )
}