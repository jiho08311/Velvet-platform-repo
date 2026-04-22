import type { ReactNode } from "react"
import { Card } from "./Card"
import { StatusBadge } from "./StatusBadge"

type RestrictedStateShellTone = "neutral" | "success" | "warning" | "danger"

type RestrictedStateShellBadgeTone =
  | "neutral"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"

type RestrictedStateShellProps = {
  title: string
  description?: string
  action?: ReactNode
  badgeLabel?: string
  badgeTone?: RestrictedStateShellBadgeTone
  visual?: ReactNode
  children?: ReactNode
  className?: string
  align?: "left" | "center"
  tone?: RestrictedStateShellTone
}

const toneClassNameMap: Record<RestrictedStateShellTone, string> = {
  neutral: "border-zinc-800 bg-zinc-900/70",
  success: "border-green-500/20 bg-zinc-900/70",
  warning: "border-yellow-500/20 bg-zinc-900/70",
  danger: "border-red-500/20 bg-zinc-900/70",
}

export function RestrictedStateShell({
  title,
  description,
  action,
  badgeLabel,
  badgeTone = "neutral",
  visual,
  children,
  className = "",
  align = "left",
  tone = "neutral",
}: RestrictedStateShellProps) {
  const isCentered = align === "center"

  return (
    <Card
      className={`${toneClassNameMap[tone]} ${className}`}
    >
      <div
        className={`flex flex-col ${
          isCentered ? "items-center text-center" : "items-start text-left"
        }`}
      >
        {badgeLabel ? (
          <div className={isCentered ? "mb-4" : "mb-3"}>
            <StatusBadge
              label={badgeLabel}
              tone={badgeTone}
            />
          </div>
        ) : null}

        {visual ? (
          <div className={isCentered ? "mb-4" : "mb-4"}>
            {visual}
          </div>
        ) : null}

        <div className={isCentered ? "max-w-md" : "w-full"}>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>

          {description ? (
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              {description}
            </p>
          ) : null}

          {children ? (
            <div className="mt-4 w-full">
              {children}
            </div>
          ) : null}

          {action ? (
            <div
              className={`mt-6 flex w-full ${
                isCentered ? "justify-center" : "justify-start"
              }`}
            >
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}