import { getSession } from "@/modules/auth/server/get-session"
import { getReports } from "@/modules/admin/server/get-reports"
import { AdminReportTable } from "@/modules/admin/ui/AdminReportTable"

export default async function AdminReportsPage() {
  const session = await getSession()

  if (!session) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center text-sm text-white/60">
          Sign in to view admin reports.
        </section>
      </main>
    )
  }

  const result = await getReports({
    limit: 20,
  })

  const reports = result?.items ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-neutral-950 p-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-2 text-sm text-white/60">
          Review reported content and moderation status.
        </p>
      </section>

      {reports.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-8 text-center">
          <p className="text-base font-medium text-white">No reports found</p>
          <p className="mt-2 text-sm text-white/60">
            Reported content will appear here.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-neutral-950 p-4">
          <AdminReportTable reports={reports} />
        </section>
      )}
    </main>
  )
}