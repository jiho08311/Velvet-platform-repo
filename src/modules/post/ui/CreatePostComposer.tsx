"use client"

import { useState, useTransition } from "react"

import { createPostAction } from "../server/create-post-action"
import { CreatePostForm } from "./CreatePostForm"

type CreatePostComposerProps = {
  creatorId: string
  onCreated?: () => void
}

export function CreatePostComposer({
  creatorId,
  onCreated,
}: CreatePostComposerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <CreatePostForm
        isSubmitting={isPending}
        onSubmitPost={({ text, visibility }) => {
          startTransition(async () => {
            try {
              setError(null)

              await createPostAction({
                creatorId,
                text,
                visibility,
              })

              onCreated?.()
            } catch (submitError) {
              setError(
                submitError instanceof Error
                  ? submitError.message
                  : "Failed to create post"
              )
            }
          })
        }}
      />
    </div>
  )
}