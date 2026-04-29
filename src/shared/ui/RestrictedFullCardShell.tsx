import type { ReactNode } from "react"
import { Card } from "./Card"

export type RestrictedFullCardShellProps = {
  backdrop?: ReactNode
  badge?: ReactNode
  overlayContent: ReactNode
  footer?: ReactNode
  className?: string
}

const restrictedFullCardClassName = "overflow-hidden p-0"

const restrictedFullCardFrameClassName = "relative"

const restrictedFullCardFallbackClassName =
  "flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500"

const restrictedFullCardBadgeClassName = "absolute left-4 top-4 z-10"

const restrictedFullCardOverlayClassName =
  "absolute inset-0 flex flex-col items-center justify-center px-6 text-center"

const restrictedFullCardOverlayContentClassName = "max-w-xs"

const restrictedFullCardFooterClassName = "p-5"

export function RestrictedFullCardShell({
  backdrop,
  badge,
  overlayContent,
  footer,
  className = "",
}: RestrictedFullCardShellProps) {
  return (
    <Card className={`${restrictedFullCardClassName} ${className}`}>
      <div className={restrictedFullCardFrameClassName}>
        {backdrop ? (
          backdrop
        ) : (
          <div className={restrictedFullCardFallbackClassName}>
            Restricted content
          </div>
        )}

        {badge ? (
          <div className={restrictedFullCardBadgeClassName}>
            {badge}
          </div>
        ) : null}

        <div className={restrictedFullCardOverlayClassName}>
          <div className={restrictedFullCardOverlayContentClassName}>
            {overlayContent}
          </div>
        </div>
      </div>

      {footer ? <div className={restrictedFullCardFooterClassName}>{footer}</div> : null}
    </Card>
  )
}
