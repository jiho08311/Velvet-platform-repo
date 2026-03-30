import { listReports } from "@/modules/report/server/list-reports"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"

export default async function AdminReportsPage() {
  const reports = await listReports()

  if (reports.length === 0) {
    return (
      <EmptyState
        title="No reports yet"
        description="Reports will appear here once users start reporting content."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Reports
        </h1>
        <p className="text-sm text-zinc-500">
          Review and moderate reported content
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500">
              <tr>
                <th className="pb-3">Reporter</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Reason</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {reports.map((report) => {
                const reporter = Array.isArray(report.reporter)
                  ? report.reporter[0]
                  : report.reporter

                return (
                  <tr key={report.id} className="hover:bg-zinc-900/50 transition">
                    <td className="py-3">
                      <div className="font-medium text-white">
                        {reporter?.display_name || reporter?.username || "Unknown"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {reporter?.email || "-"}
                      </div>
                    </td>

                    <td className="py-3 text-zinc-300">
                      <div>{report.target_type}</div>
                      <div className="text-xs text-zinc-500">
                        {report.target_id.slice(0, 8)}
                      </div>
                    </td>

                    <td className="py-3 text-zinc-300">
                      <div className="font-medium">{report.reason}</div>
                      <div className="text-xs text-zinc-500">
                        {report.description || "-"}
                      </div>
                    </td>

                    <td className="py-3">
                      <StatusBadge label={report.status} />
                    </td>

                    <td className="py-3 text-zinc-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}