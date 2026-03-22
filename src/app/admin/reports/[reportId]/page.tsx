import Link from "next/link"
import { getReportById } from "@/modules/report/server/get-report-by-id"

type AdminReportDetailPageProps = {
  params: Promise<{
    reportId: string
  }>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export default async function AdminReportDetailPage({
  params,
}: AdminReportDetailPageProps) {
  const { reportId } = await params
  const report = await getReportById(reportId)

  if (!report) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Link
            href="/admin/reports"
            className="inline-flex w-fit items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back to reports
          </Link>

          <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <h1 className="text-2xl font-semibold text-white">Report not found</h1>
            <p className="mt-3 text-sm text-zinc-400">
              This report detail is not available.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin/reports"
            className="inline-flex items-center rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            ← Back
          </Link>

          <button
            type="button"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Resolve
          </button>
        </div>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Report detail
          </h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Target type
              </p>
              <p className="mt-3 text-sm capitalize text-zinc-200">
                {report.targetType}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Status
              </p>
              <p className="mt-3 text-sm capitalize text-zinc-200">
                {report.status}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 md:col-span-2">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Reason
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-200">
                {report.reason}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Reporter
              </p>
              {report.reporter ? (
                <div className="mt-3 space-y-1 text-sm text-zinc-200">
                  <p>{report.reporter.displayName}</p>
                  <p>@{report.reporter.username}</p>
                  <p className="text-zinc-400">{report.reporter.email}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  Reporter information is unavailable.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Created at
              </p>
              <p className="mt-3 text-sm text-zinc-200">
                {formatDate(report.createdAt)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            Related content
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Content placeholder
          </h2>

          <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 text-sm text-zinc-500">
            Related content placeholder
          </div>
        </section>
      </div>
    </main>
  )
}