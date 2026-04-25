import { notFound } from "next/navigation"
import { getReportById } from "@/modules/report/server/get-report-by-id"
import { Card } from "@/shared/ui/Card"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type Props = {
  params: Promise<{
    reportId: string
  }>
}

function formatDate(value: string | null) {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString()
}

export default async function AdminReportDetailPage({ params }: Props) {
  const { reportId } = await params
  const report = await getReportById(reportId)

  if (!report) {
    notFound()
  }

  const reporterName =
    report.reporter?.displayName ||
    report.reporter?.username ||
    "Unknown reporter"

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/admin/reports"
          className="text-sm text-zinc-500 hover:text-white"
        >
          Back to reports
        </a>

        <h1 className="mt-3 text-2xl font-semibold text-white">
          Report detail
        </h1>

        <p className="text-sm text-zinc-500">
          Review report metadata and target reference.
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Report
              </div>
              <div className="mt-1 font-mono text-sm text-zinc-300">
                {report.id}
              </div>
            </div>

            <StatusBadge label={report.status} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Reason
              </div>
              <div className="mt-1 text-sm text-white">
                {report.reason}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Created
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {formatDate(report.createdAt)}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Updated
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {formatDate(report.updatedAt)}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Reviewed
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {formatDate(report.reviewedAt)}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Description
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
              {report.description || "-"}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Reporter
            </h2>
            <p className="text-sm text-zinc-500">
              User metadata available at report time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Name
              </div>
              <div className="mt-1 text-sm text-white">
                {reporterName}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Email
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {report.reporter?.email || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Username
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {report.reporter?.username || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Reporter ID
              </div>
              <div className="mt-1 break-all font-mono text-sm text-zinc-300">
                {report.reporter?.id || "-"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Target reference
            </h2>
            <p className="text-sm text-zinc-500">
              Target type and id are preserved even when lookup is unavailable.
            </p>
          </div>

          {report.targetReference.missing ? (
            <div className="rounded-xl border border-yellow-900/60 bg-yellow-950/20 p-3 text-sm text-yellow-200">
              Target lookup is unavailable. The original target reference is
              still shown below.
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Target type
              </div>
              <div className="mt-1 text-sm text-white">
                {report.targetReference.type}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Target ID
              </div>
              <div className="mt-1 break-all font-mono text-sm text-zinc-300">
                {report.targetReference.id}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Label
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {report.targetReference.label || "-"}
              </div>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Link
              </div>
              <div className="mt-1 text-sm text-zinc-300">
                {report.targetReference.href ? (
                  <a
                    href={report.targetReference.href}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Open target
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}