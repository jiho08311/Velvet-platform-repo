type AdminTableProps = {
  headers: string[]
  children: React.ReactNode
  className?: string
  headerClassName?: string
  bodyClassName?: string
}

export function AdminTable({
  headers,
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}: AdminTableProps) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-zinc-800 ${className}`}>
      <div
        className={`hidden gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 sm:grid ${headerClassName}`}
      >
        {headers.map((header) => (
          <span key={header}>{header}</span>
        ))}
      </div>

      <div className={`divide-y divide-zinc-800 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  )
}