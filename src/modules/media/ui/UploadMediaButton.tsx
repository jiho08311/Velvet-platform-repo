import React, { useRef } from "react"

export type UploadMediaButtonProps = {
  accept?: string
  disabled?: boolean
  onSelectFile?: (file: File) => void
}

export function UploadMediaButton({
  accept = "image/*,video/*",
  disabled = false,
  onSelectFile,
}: UploadMediaButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function handleClick() {
    if (disabled) return
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onSelectFile?.(file)
    e.target.value = ""
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Upload Media
      </button>
    </div>
  )
}