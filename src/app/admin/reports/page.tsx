import { listReports } from "@/modules/report/server/list-reports"
import { Card } from "@/shared/ui/Card"
import { EmptyState } from "@/shared/ui/EmptyState"
import { updateReportStatusAction } from "./actions"
import { AdminReportTable } from "@/modules/admin/ui/AdminReportTable"

type Props = {
  searchParams: Promise<{
    cursor?: string
  }>
}

type ReportActionStatus = "reviewing" | "resolved" | "rejected"

function ReportActionButton({
  reportId,
  status,
  label,
}: {
  reportId: string
  status: ReportActionStatus
  label: string
}) {
  const toneClass: Record<ReportActionStatus, string> = {
    reviewing: "bg-yellow-600",
    resolved: "bg-green-600",
    rejected: "bg-red-600",
  }

  return (
    <form action={updateReportStatusAction}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />
      <button
        className={`rounded-xl px-3 py-1 text-xs font-semibold text-white ${toneClass[status]}`}
      >
        {label}
      </button>
    </form>
  )
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
        <h1 className="text-2xl font-semibold text-white">Reports</h1>
        <p className="text-sm text-zinc-500">
          Review and moderate reported content
        </p>
      </div>

      <Card>
        <AdminReportTable
          reports={reports}
          renderActions={(report) => (
            <div className="flex flex-wrap gap-2">
              {report.actionEligibility.canMarkReviewing && (
                <ReportActionButton
                  reportId={report.id}
                  status="reviewing"
                  label="Review"
                />
              )}
              {report.actionEligibility.canResolve && (
                <ReportActionButton
                  reportId={report.id}
                  status="resolved"
                  label="Resolve"
                />
              )}
              {report.actionEligibility.canReject && (
                <ReportActionButton
                  reportId={report.id}
                  status="rejected"
                  label="Reject"
                />
              )}
            </div>
          )}
        />
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