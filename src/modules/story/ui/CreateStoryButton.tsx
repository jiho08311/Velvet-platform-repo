"use client"

import { useRouter } from "next/navigation"

type CreateStoryButtonProps = {
  onClick?: () => void
}

export function CreateStoryButton({
  onClick,
}: CreateStoryButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    router.push("/story/new")
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
      aria-label="Create story"
    >
      <span className="text-base leading-none">+</span>
      <span>Story</span>
    </button>
  )
}