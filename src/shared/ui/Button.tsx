import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary" | "danger"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  loading?: boolean
  loadingLabel?: string
  fullWidth?: boolean
  embedded?: boolean
}

function getBaseClassName({
  fullWidth,
  embedded,
}: {
  fullWidth: boolean
  embedded: boolean
}) {
  const widthClassName = fullWidth ? "w-full" : ""
  const embeddedClassName = embedded
    ? "min-w-[220px] rounded-full px-6"
    : "rounded-2xl px-4"

  return [
    "inline-flex",
    "min-h-[44px]",
    "items-center",
    "justify-center",
    embeddedClassName,
    widthClassName,
    "py-2",
    "text-sm",
    "font-semibold",
    "transition",
    "whitespace-nowrap",
    "disabled:cursor-not-allowed",
  ]
    .filter(Boolean)
    .join(" ")
}

function getVariantClassName(variant: ButtonVariant) {
  if (variant === "primary") {
    return [
      "bg-[#C2185B]",
      "text-white",
      "hover:bg-[#D81B60]",
      "active:bg-[#AD1457]",
      "disabled:opacity-60",
    ].join(" ")
  }

  if (variant === "danger") {
    return [
      "bg-red-600",
      "text-white",
      "hover:bg-red-500",
      "active:bg-red-700",
      "disabled:opacity-60",
    ].join(" ")
  }

  return [
    "border",
    "border-zinc-800",
    "bg-zinc-900",
    "text-zinc-100",
    "hover:bg-zinc-800",
    "disabled:opacity-50",
  ].join(" ")
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  loading = false,
  loadingLabel,
  fullWidth = false,
  embedded = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
  const baseClassName = getBaseClassName({
    fullWidth,
    embedded,
  })
  const variantClassName = getVariantClassName(variant)

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClassName} ${variantClassName} ${className}`}
      {...props}
    >
      {loading ? loadingLabel ?? children : children}
    </button>
  )
}