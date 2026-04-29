import type { ReactNode } from "react"
import { Card } from "./Card"
import {
  restrictedShellClassName,
  restrictedShellClassNames,
} from "./RestrictedStateShell"

export type RestrictedFullCardShellProps = {
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
    <Card
      className={restrictedShellClassName(
        restrictedShellClassNames.fullCard.card,
        className,
      )}
    >
      <div className={restrictedShellClassNames.fullCard.frame}>
        {backdrop ? (
          backdrop
        ) : (
          <div className={restrictedShellClassNames.fullCard.fallback}>
            Restricted content
          </div>
        )}

        {badge ? (
          <div className={restrictedShellClassNames.fullCard.badge}>
            {badge}
          </div>
        ) : null}

        <div className={restrictedShellClassNames.fullCard.overlay}>
          <div className={restrictedShellClassNames.fullCard.overlayContent}>
            {overlayContent}
          </div>
        </div>
      </div>

      {footer ? (
        <div className={restrictedShellClassNames.fullCard.footer}>
          {footer}
        </div>
      ) : null}
    </Card>
  )
}
