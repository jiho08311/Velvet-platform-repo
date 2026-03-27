import type { ReactNode } from "react"

type CardVariant = "default" | "elevated"

type CardProps = {
  children: ReactNode
  className?: string
  variant?: CardVariant
}

export function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const base =
    "rounded-3xl border p-5 text-white transition"

  const variants = {
    default: "border-zinc-800 bg-zinc-900/70",
    elevated: "border-zinc-800 bg-zinc-900 shadow-[0_0_0_1px_rgba(39,39,42,0.2)]",
  }

  return (
    <section className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </section>
  )
}