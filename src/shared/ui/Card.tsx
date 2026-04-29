import type { ReactNode } from "react"

export type CardVariant = "default" | "elevated"

export type CardProps = {
  children: ReactNode
  className?: string
  variant?: CardVariant
}

const cardBaseClassName =
  "rounded-3xl border p-5 text-white transition"

const cardVariantClassNames = {
  default: "border-zinc-800 bg-zinc-900/70",
  elevated: "border-zinc-800 bg-zinc-900 shadow-[0_0_0_1px_rgba(39,39,42,0.2)]",
} satisfies Record<CardVariant, string>

export function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  return (
    <section className={`${cardBaseClassName} ${cardVariantClassNames[variant]} ${className}`}>
      {children}
    </section>
  )
}
