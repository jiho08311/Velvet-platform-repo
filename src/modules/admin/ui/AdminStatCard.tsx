type AdminStatCardProps = {
  label: string
  value: string | number
  helperText?: string
}

export function AdminStatCard({
  label,
  value,
  helperText,
}: AdminStatCardProps) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {helperText ? (
        <p className="mt-2 text-xs text-zinc-500">{helperText}</p>
      ) : null}
    </div>
  )
}