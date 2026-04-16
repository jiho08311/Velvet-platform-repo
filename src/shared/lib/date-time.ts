// src/shared/lib/date-time.ts
export function formatInUserTimeZone(
  dateString: string,
  options?: {
    withTime?: boolean
  }
) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    ...(options?.withTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(date)
}
export function localDateTimeToUtcIso(
  value: string | null | undefined
): string | null {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}