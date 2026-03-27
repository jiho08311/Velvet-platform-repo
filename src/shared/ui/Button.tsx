type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary"
  className?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: ButtonProps) {
  const base =
    "inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"

  const styles =
    variant === "primary"
      ? "bg-[#C2185B] text-white hover:bg-[#D81B60] active:bg-[#AD1457]"
      : "border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </button>
  )
}