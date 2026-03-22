type AdminEmptyStateProps = {
  message: string
}

export function AdminEmptyState({ message }: AdminEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-10 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  )
}