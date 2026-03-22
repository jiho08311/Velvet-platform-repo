// src/app/admin/loading.tsx
export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-zinc-800"
            />
          ))}
        </div>

        <div className="h-64 rounded-2xl bg-zinc-800" />

        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    </main>
  )
}