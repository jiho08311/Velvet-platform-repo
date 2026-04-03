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
    <div className="space-y-4">
      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <CreatePostForm
        isSubmitting={isPending}
        onSubmitPost={({ text, visibility, price, files }) => {
          startTransition(async () => {
            try {
              setError(null)

              await createPostAction({
                creatorId,
                text,
                visibility,
                price,
                files,
              })

              onCreated?.()
            } catch (submitError) {
              if (submitError instanceof Error) {
                if (submitError.message === "TEXT_BLOCKED") {
                  setError("부적절한 텍스트가 포함되어 있어 게시글을 올릴 수 없습니다.")
                  return
                }

                if (submitError.message === "IMAGE_BLOCKED") {
                  setError("부적절한 이미지가 포함되어 있어 게시글을 올릴 수 없습니다.")
                  return
                }

                setError(submitError.message)
                return
              }

              setError("Failed to create post")
            }
          })
        }}
      />
    </div>
  )
}