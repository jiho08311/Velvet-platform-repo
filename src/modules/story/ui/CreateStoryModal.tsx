"use client"

import { useCallback } from "react"

import { CreateStoryComposer } from "./CreateStoryComposer"

type CreateStoryModalProps = {
  open: boolean
  onClose: () => void
}

export function CreateStoryModal({
  open,
  onClose,
}: CreateStoryModalProps) {
  const handleCreated = useCallback(() => {
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="my-6 w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
      >
        <CreateStoryComposer onCreated={handleCreated} />

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-zinc-100 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          Close
        </button>
      </div>
    </div>
  )
}
