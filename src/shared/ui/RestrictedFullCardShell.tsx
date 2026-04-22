import type { ReactNode } from "react"
import { Card } from "./Card"

type RestrictedFullCardShellProps = {
  backdrop?: ReactNode
  badge?: ReactNode
  overlayContent: ReactNode
  footer?: ReactNode
  className?: string
}

export function RestrictedFullCardShell({
  backdrop,
  badge,
  overlayContent,
  footer,
  className = "",
}: RestrictedFullCardShellProps) {
  return (
    <Card className={`overflow-hidden p-0 ${className}`}>
      <div className="relative">
        {backdrop ? (
          backdrop
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500">
            Restricted content
          </div>
        )}

        {badge ? (
          <div className="absolute left-4 top-4 z-10">
            {badge}
          </div>
        ) : null}

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-xs">
            {overlayContent}
          </div>
        </div>
      </div>

      {footer ? <div className="p-5">{footer}</div> : null}
    </Card>
  )
}