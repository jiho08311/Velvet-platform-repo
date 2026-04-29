import { AdminTable } from "./AdminTable"
import { StatusBadge } from "@/shared/ui/StatusBadge"

type ReportActionEligibility = {
  canMarkReviewing: boolean
  canResolve: boolean
  canReject: boolean
}

type AdminReportTableItem = {
  id: string
  reporterLabel: string
  reporterEmailLabel: string
  targetReference: {
    type: string
  }
  targetShortId: string
  reason: string
  description?: string | null
  status: string
  createdDateLabel: string
  actionEligibility: ReportActionEligibility
}

type AdminReportTableProps = {
  reports: AdminReportTableItem[]
  renderActions: (report: AdminReportTableItem) => React.ReactNode
}

function AdminReportRow({
  report,
  renderActions,
}: {
  report: AdminReportTableItem
  renderActions: (report: AdminReportTableItem) => React.ReactNode
}) {
  return (
    <div className="grid grid-cols-6 gap-4 px-4 py-4 text-sm text-white">
      {/* Reporter */}
      <div>
        <p className="font-medium">{report.reporterLabel}</p>
        <p className="text-xs text-zinc-500">{report.reporterEmailLabel}</p>
      </div>

      {/* Target */}
      <div className="text-zinc-300">
        <div>{report.targetReference.type}</div>
        <div className="text-xs text-zinc-500">{report.targetShortId}</div>
      </div>

      {/* Reason */}
      <div className="text-zinc-300">
        <div className="font-medium">{report.reason}</div>
        <div className="text-xs text-zinc-500">
          {report.description || "-"}
        </div>
      </div>

      {/* Status */}
      <div>
        <StatusBadge label={report.status} />
      </div>

      {/* Actions */}
      <div>
        {renderActions(report)}
      </div>

      {/* Created */}
      <div className="text-zinc-400">
        {report.createdDateLabel}
      </div>
    </div>
  )
}

export function AdminReportTable({
  reports,
  renderActions,
}: AdminReportTableProps) {
  return (
    <AdminTable
      headers={[
        "Reporter",
        "Target",
        "Reason",
        "Status",
        "Action",
        "Created",
      ]}
      headerClassName="grid-cols-6"
      bodyClassName=""
    >
      {reports.map((report) => (
        <AdminReportRow
          key={report.id}
          report={report}
          renderActions={renderActions}
        />
      ))}
    </AdminTable>
  )
}