// src/app/admin/reports/error.tsx
"use client"

type AdminReportsErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminReportsError({
  reset,
}: AdminReportsErrorProps) {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
          Report
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Failed to load reports
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          The reports page could not be loaded. Please try again.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Retry
          </button>
          <a
            href="/admin"
            className="inline-flex items-center rounded-full border border-zinc-700 px-5 py-3 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            Back to admin
          </a>
        </div>
      </div>
    </main>
  )
}