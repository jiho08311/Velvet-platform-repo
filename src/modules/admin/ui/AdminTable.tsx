type AdminTableProps = {
  headers: string[]
  children: React.ReactNode
}

export function AdminTable({ headers, children }: AdminTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-800">
      <div className="hidden grid-cols-1 gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 sm:grid">
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>

      <div className="divide-y divide-zinc-800">{children}</div>
    </div>
  )
}