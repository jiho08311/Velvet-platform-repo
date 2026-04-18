type Tone = "default" | "success" | "warning" | "danger" | "info"

type StatusBadgeProps = {
  label: string
  tone?: Tone
}

const toneClassNameMap: Record<Tone, string> = {
  default: "border-zinc-800 bg-zinc-900 text-zinc-300",
  success: "border-green-900/60 bg-green-950/60 text-green-300",
  warning: "border-yellow-900/60 bg-yellow-950/60 text-yellow-300",
  danger: "border-red-900/60 bg-red-950/60 text-red-300",
  info: "border-[#C2185B]/30 bg-[#C2185B]/10 text-[#F472B6]",
}

function getToneFromLabel(label: string): Tone {
  const value = label.toLowerCase()

  if (value === "pending") return "warning"
  if (value === "pending_request") return "warning"
  if (value === "approved") return "info"
  if (value === "processing") return "info"
  if (value === "rejected") return "danger"
  if (value === "paid" || value === "success") return "success"
  if (value === "failed" || value === "error") return "danger"
  if (value === "inactive") return "default"
  if (value === "unread") return "info"
  if (value === "read") return "default"

  return "default"
}

function translateLabel(label: string) {
  const value = label.toLowerCase()

  if (value === "pending") return "대기중"
  if (value === "pending_request") return "요청 대기중"
  if (value === "approved") return "승인됨"
  if (value === "processing") return "처리중"
  if (value === "rejected") return "거절됨"
  if (value === "paid") return "지급 완료"
  if (value === "failed") return "실패"
  if (value === "inactive") return "비활성"
  if (value === "success") return "완료"
  if (value === "unread") return "읽지 않음"
  if (value === "read") return "읽음"

  return label
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const resolvedTone: Tone = tone ?? getToneFromLabel(label)

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize tracking-wide ${toneClassNameMap[resolvedTone]}`}
    >
      {translateLabel(label)}
    </span>
  )
}