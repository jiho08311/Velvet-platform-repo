import type { ReactNode } from "react"
import { Card } from "./Card"
import { StatusBadge } from "./StatusBadge"

export type RestrictedStateShellTone = "neutral" | "success" | "warning" | "danger"

export type RestrictedStateShellBadgeTone =
  | "neutral"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"

export type RestrictedStateShellAlign = "left" | "center"

export type RestrictedStateShellProps = {
  title: string
  description?: string
  action?: ReactNode
  badgeLabel?: string
  badgeTone?: RestrictedStateShellBadgeTone
  visual?: ReactNode
  children?: ReactNode
  className?: string
  align?: RestrictedStateShellAlign
  tone?: RestrictedStateShellTone
}

const toneClassNameMap = {
  neutral: "border-zinc-800 bg-zinc-900/70",
  success: "border-green-500/20 bg-zinc-900/70",
  warning: "border-yellow-500/20 bg-zinc-900/70",
  danger: "border-red-500/20 bg-zinc-900/70",
} satisfies Record<RestrictedStateShellTone, string>

const alignClassNameMap = {
  left: "items-start text-left",
  center: "items-center text-center",
} satisfies Record<RestrictedStateShellAlign, string>

const badgeWrapperClassNameMap = {
  left: "mb-3",
  center: "mb-4",
} satisfies Record<RestrictedStateShellAlign, string>

const contentClassNameMap = {
  left: "w-full",
  center: "max-w-md",
} satisfies Record<RestrictedStateShellAlign, string>

const actionWrapperClassNameMap = {
  left: "justify-start",
  center: "justify-center",
} satisfies Record<RestrictedStateShellAlign, string>

const visualWrapperClassName = "mb-4"

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
  return (
    <Card
      className={`${toneClassNameMap[tone]} ${className}`}
    >
      <div
        className={`flex flex-col ${alignClassNameMap[align]}`}
      >
        {badgeLabel ? (
          <div className={badgeWrapperClassNameMap[align]}>
            <StatusBadge
              label={badgeLabel}
              tone={badgeTone}
            />
          </div>
        ) : null}

        {visual ? (
          <div className={visualWrapperClassName}>
            {visual}
          </div>
        ) : null}

        <div className={contentClassNameMap[align]}>
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
              className={`mt-6 flex w-full ${actionWrapperClassNameMap[align]}`}
            >
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
