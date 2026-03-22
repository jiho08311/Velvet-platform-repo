type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
  className?: string
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"

  const styles =
    variant === "primary"
      ? "bg-[#C2185B] text-white hover:bg-[#D81B60] active:bg-[#AD1457]"
      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"

  return (
    <button
      onClick={onClick}
      className={`${base} ${styles} rounded-md ${className}`}
    >
      {children}
    </button>
  )
}