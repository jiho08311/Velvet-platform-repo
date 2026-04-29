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

export function restrictedShellClassName(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ")
}

export const restrictedShellClassNames = {
  state: {
    tone: {
      neutral: "border-zinc-800 bg-zinc-900/70",
      success: "border-green-500/20 bg-zinc-900/70",
      warning: "border-yellow-500/20 bg-zinc-900/70",
      danger: "border-red-500/20 bg-zinc-900/70",
    } satisfies Record<RestrictedStateShellTone, string>,
    align: {
      left: "items-start text-left",
      center: "items-center text-center",
    } satisfies Record<RestrictedStateShellAlign, string>,
    badgeWrapper: {
      left: "mb-3",
      center: "mb-4",
    } satisfies Record<RestrictedStateShellAlign, string>,
    content: {
      left: "w-full",
      center: "max-w-md",
    } satisfies Record<RestrictedStateShellAlign, string>,
    actionWrapper: {
      left: "justify-start",
      center: "justify-center",
    } satisfies Record<RestrictedStateShellAlign, string>,
    visualWrapper: "mb-4",
  },
  fullCard: {
    card: "overflow-hidden p-0",
    frame: "relative",
    fallback:
      "flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500",
    badge: "absolute left-4 top-4 z-10",
    overlay:
      "absolute inset-0 flex flex-col items-center justify-center px-6 text-center",
    overlayContent: "max-w-xs",
    footer: "p-5",
  },
} as const

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
      className={restrictedShellClassName(
        restrictedShellClassNames.state.tone[tone],
        className,
      )}
    >
      <div
        className={restrictedShellClassName(
          "flex flex-col",
          restrictedShellClassNames.state.align[align],
        )}
      >
        {badgeLabel ? (
          <div className={restrictedShellClassNames.state.badgeWrapper[align]}>
            <StatusBadge
              label={badgeLabel}
              tone={badgeTone}
            />
          </div>
        ) : null}

        {visual ? (
          <div className={restrictedShellClassNames.state.visualWrapper}>
            {visual}
          </div>
        ) : null}

        <div className={restrictedShellClassNames.state.content[align]}>
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
              className={restrictedShellClassName(
                "mt-6 flex w-full",
                restrictedShellClassNames.state.actionWrapper[align],
              )}
            >
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
