type AdminReportTableItem = {
  id: string
  targetType: string
  targetId: string
  reporterUserId: string
  reason: string
  status: string
  createdAt: string
}

type AdminReportTableProps = {
  reports: AdminReportTableItem[]
  emptyMessage?: string
}

export function AdminReportTable({
  reports,
  emptyMessage = "No reports found.",
}: AdminReportTableProps) {
  if (reports.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
        {emptyMessage}
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm text-white">
          <thead className="bg-white/5 text-white/60">
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-white/10 last:border-b-0"
              >
                <td className="px-4 py-4 align-top">
                  <div className="space-y-1">
                    <p className="font-medium text-white">{report.targetType}</p>
                    <p className="text-xs text-white/45">{report.targetId}</p>
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-white/75">
                  <p className="max-w-md whitespace-pre-wrap leading-6">
                    {report.reason}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-white/60">
                  {report.reporterUserId}
                </td>
                <td className="px-4 py-4 align-top text-white/45">
                  {report.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}