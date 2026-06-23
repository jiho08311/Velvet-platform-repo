import { DashboardPageView } from "./DashboardPageView"
import { loadDashboardPageData } from "./dashboard-page-data"

export default async function PayoutsPage() {
  const data = await loadDashboardPageData()
  return <DashboardPageView data={data} />
}
