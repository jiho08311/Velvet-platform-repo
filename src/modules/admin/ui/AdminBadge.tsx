type AdminBadgeStatus = "pending" | "approved" | "rejected" | "active" | "disabled"

type AdminBadgeProps = {
  status: AdminBadgeStatus
}

function getClassName(status: AdminBadgeStatus) {
  if (status === "approved" || status === "active") {
    return "bg-green-500/15 text-green-500"
  }

  if (status === "rejected" || status === "disabled") {
    return "bg-red-500/15 text-red-500"
  }

  return "bg-yellow-500/15 text-yellow-500"
}

export function AdminBadge({ status }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getClassName(
        status
      )}`}
    >
      {status}
    </span>
  )
}