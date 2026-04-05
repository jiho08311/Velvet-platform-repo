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
        <p className="text-sm font-medium text-white">구독이 없습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          콘텐츠를 이용하려면 구독이 필요합니다.
        </p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">구독이 종료되었습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}에 구독이 종료되었습니다. 다시 구독하면 이용 가능합니다.`
            : "구독이 종료되었습니다. 다시 구독하면 이용 가능합니다."}
        </p>
      </div>
    )
  }

  if (status === "canceled" || cancelAtPeriodEnd) {
    return (
      <div className="rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">구독 종료 예정</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}까지 이용 가능합니다.`
            : "현재 구독 기간 종료 시 이용이 종료됩니다."}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-green-500/20 bg-zinc-900/70 p-5">
      <p className="text-sm font-medium text-white">구독 중</p>
      <p className="mt-2 text-sm text-zinc-400">
        {formattedEndDate
          ? `다음 결제 기준일은 ${formattedEndDate}입니다.`
          : "현재 이용 가능합니다."}
      </p>
    </div>
  )
}