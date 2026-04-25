import { listReports } from "@/modules/report/server/list-reports"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { StatusBadge } from "@/shared/ui/StatusBadge"
import { updateReportStatusAction } from "./actions"

type Props = {
  searchParams: Promise<{
    cursor?: string
  }>
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const rawCursor = resolvedSearchParams?.cursor
  const cursor = rawCursor ? rawCursor.replace(" ", "+") : undefined

  const { data: reports, nextCursor } = await listReports({
    limit: 20,
    cursor,
  })

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
                <th className="pb-3">Action</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800">
              {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-zinc-900/50 transition"
                  >
                    <td className="py-3">
                      <div className="font-medium text-white">
                        {report.reporterLabel}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {report.reporterEmailLabel}
                      </div>
                    </td>

                    <td className="py-3 text-zinc-300">
                      <div>{report.targetType}</div>
                      <div className="text-xs text-zinc-500">
                        {report.targetShortId}
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

                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <form action={updateReportStatusAction}>
                          <input
                            type="hidden"
                            name="reportId"
                            value={report.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="reviewing"
                          />
                          <button className="rounded-xl bg-yellow-600 px-3 py-1 text-xs font-semibold text-white">
                            Review
                          </button>
                        </form>

                        <form action={updateReportStatusAction}>
                          <input
                            type="hidden"
                            name="reportId"
                            value={report.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="resolved"
                          />
                          <button className="rounded-xl bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                            Resolve
                          </button>
                        </form>

                        <form action={updateReportStatusAction}>
                          <input
                            type="hidden"
                            name="reportId"
                            value={report.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="rejected"
                          />
                          <button className="rounded-xl bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>

                    <td className="py-3 text-zinc-400">
                      {report.createdDateLabel}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {nextCursor && (
        <div className="flex justify-center">
          <a
            href={`/admin/reports?cursor=${encodeURIComponent(nextCursor)}`}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            Load more
          </a>
        </div>
      )}
    </div>
  )
}
