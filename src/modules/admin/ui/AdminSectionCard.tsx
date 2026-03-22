type AdminSectionCardProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export function AdminSectionCard({
  title,
  description,
  children,
}: AdminSectionCardProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="mb-4">
        <p className="text-lg font-semibold text-white">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>

      {children}
    </section>
  )
}