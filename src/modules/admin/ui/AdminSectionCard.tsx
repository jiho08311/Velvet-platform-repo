import { Card } from "@/shared/ui/Card"

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
    <Card>
      <div className="mb-4">
        <p className="text-lg font-semibold text-white">{title}</p>
        {description ? (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>

      {children}
    </Card>
  )
}
