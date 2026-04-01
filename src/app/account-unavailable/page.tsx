export default function AccountUnavailablePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-950">
            Account unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            This account is no longer available.
          </p>
        </div>
      </div>
    </main>
  )
}