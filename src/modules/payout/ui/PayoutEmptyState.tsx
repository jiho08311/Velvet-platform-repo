type PayoutEmptyStateProps = {
  title?: string
  description?: string
}

const DEFAULT_PAYOUT_EMPTY_STATE_TITLE = "출금 내역이 없습니다"
const DEFAULT_PAYOUT_EMPTY_STATE_DESCRIPTION =
  "출금 실행 내역이 생성되면 여기에 표시됩니다."

const payoutEmptyStateShellClassName =
  "overflow-hidden rounded-[28px] border border-zinc-200 bg-white"

const payoutEmptyStateHeaderClassName =
  "border-b border-zinc-200 px-6 py-4"

const payoutEmptyStateHeaderGridClassName =
  "grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"

const payoutEmptyStateBodyClassName =
  "flex flex-col items-center justify-center px-6 py-16 text-center"

const payoutEmptyStateVisualClassName =
  "mb-4 h-12 w-12 rounded-2xl bg-zinc-100"

function PayoutEmptyStateHeader() {
  return (
    <div className={payoutEmptyStateHeaderClassName}>
      <div className={payoutEmptyStateHeaderGridClassName}>
        <span>출금</span>
        <span>금액</span>
        <span>상태</span>
      </div>
    </div>
  )
}

function PayoutEmptyStateBody({
  title,
  description,
}: Required<PayoutEmptyStateProps>) {
  return (
    <div className={payoutEmptyStateBodyClassName}>
      <div className={payoutEmptyStateVisualClassName} />
      <p className="text-lg font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  )
}

export function PayoutEmptyState({
  title = DEFAULT_PAYOUT_EMPTY_STATE_TITLE,
  description = DEFAULT_PAYOUT_EMPTY_STATE_DESCRIPTION,
}: PayoutEmptyStateProps) {
  return (
    <div className={payoutEmptyStateShellClassName}>
      <PayoutEmptyStateHeader />
      <PayoutEmptyStateBody title={title} description={description} />
    </div>
  )
}