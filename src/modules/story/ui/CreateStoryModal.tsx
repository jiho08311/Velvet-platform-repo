"use client"

import { CreateStoryComposer } from "./CreateStoryComposer"

type CreateStoryModalProps = {
  open: boolean
  onClose: () => void
}

export function CreateStoryModal({
  open,
  onClose,
}: CreateStoryModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 p-4">
        <CreateStoryComposer
          onCreated={() => {
            onClose()
          }}
        />

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-zinc-800 py-2 text-sm text-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}