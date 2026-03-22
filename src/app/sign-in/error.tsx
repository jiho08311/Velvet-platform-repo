"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>

      <pre className="text-sm text-red-400">
        {error.message}
      </pre>

      <button
        onClick={() => reset()}
        className="rounded-lg bg-white px-4 py-2 text-black"
      >
        Try again
      </button>
    </div>
  )
}