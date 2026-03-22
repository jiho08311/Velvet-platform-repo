import type { ReactNode } from "react"

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`
        rounded-md
        border border-zinc-200
        bg-white
        p-4
        shadow-sm
        transition-colors duration-200
        hover:border-[#C2185B]/40
        ${className}
      `}
    >
      {children}
    </section>
  )
}