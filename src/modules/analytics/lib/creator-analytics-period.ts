export const CREATOR_ANALYTICS_PERIOD = {
  id: "current-month",
  label: "Current month",
  revenueMetricLabel: "Current Month Revenue",
} as const

export function getCreatorAnalyticsPeriodStart(date = new Date()) {
  const periodStart = new Date(date)
  periodStart.setDate(1)
  periodStart.setHours(0, 0, 0, 0)

  return periodStart.toISOString()
}
