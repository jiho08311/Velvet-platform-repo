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
        <p className="text-sm font-medium text-white">이용권이 없습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          콘텐츠 및 메시지 기능 이용을 위해 이용권이 필요합니다.
        </p>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">이용 기간이 종료되었습니다</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}에 이용 기간이 종료되었습니다. 다시 이용권을 구매하면 접근이 가능합니다.`
            : "이용 기간이 종료되었습니다. 다시 이용권을 구매하면 접근이 가능합니다."}
        </p>
      </div>
    )
  }

  if (status === "canceled" || cancelAtPeriodEnd) {
    return (
      <div className="rounded-3xl border border-yellow-500/20 bg-zinc-900/70 p-5">
        <p className="text-sm font-medium text-white">이용 종료 예정</p>
        <p className="mt-2 text-sm text-zinc-400">
          {formattedEndDate
            ? `${formattedEndDate}까지 이용 가능합니다.`
            : "현재 이용 기간 종료 시 이용이 종료됩니다."}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-green-500/20 bg-zinc-900/70 p-5">
      <p className="text-sm font-medium text-white">이용 중</p>
      <p className="mt-2 text-sm text-zinc-400">
        {formattedEndDate
          ? `다음 기준일은 ${formattedEndDate}입니다.`
          : "현재 이용 가능합니다."}
      </p>
    </div>
  )
}