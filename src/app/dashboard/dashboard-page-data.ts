import { getDashboardMainReadModel } from "@/modules/analytics/public/get-dashboard-main-read-model"
import { readCreatorOperationalReadiness } from "@/modules/creator/public/read-creator-operational-readiness"
import { requireCreatorReadyUser } from "@/modules/creator/public/require-creator-ready-user"

export async function loadDashboardPageData() {
  const { user } = await requireCreatorReadyUser({
    signInNext: "/dashboard/payouts",
  })
  const readiness = await readCreatorOperationalReadiness({
    userId: user.id,
  })

  if (!readiness.ok) {
    return {
      kind: "pending" as const,
    }
  }

  const dashboard = await getDashboardMainReadModel(readiness.creator)

  if (!dashboard) {
    return {
      kind: "empty" as const,
    }
  }

  return {
    dashboard,
    kind: "ready" as const,
  }
}

export type DashboardPageData = Awaited<ReturnType<typeof loadDashboardPageData>>
