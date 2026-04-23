"use client"

import { useState, useTransition } from "react"

import type {
  CreatePostClientDraftBlock,
  CreateOrEditPostFormBlock,
  PostVisibility,
} from "../types"
import { updatePostAction } from "../server/update-post-action"
import { CreatePostForm } from "./CreatePostForm"
import { resolveCreatePostComposerErrorPresentation } from "./post-composer-ui-state"

type EditPostComposerProps = {
  postId: string
  initialBlocks: CreateOrEditPostFormBlock[]
  initialVisibility: PostVisibility
}

type ClientUploadEntry = {
  placeholderId: string
  file: File
}

function collectUploadedFilesFromDraft(
  blocks: CreatePostClientDraftBlock[],
  uploadedFiles: Record<string, File>
): File[] {
  const files: ClientUploadEntry[] = []

  for (const block of blocks) {
    if (block.type === "text") {
      continue
    }

    if (block.type === "carousel") {
      for (const item of block.items) {
        if (item.media.kind !== "uploaded") {
          continue
        }

        const file = uploadedFiles[item.media.uploaded.placeholderId]

        if (file) {
          files.push({
            placeholderId: item.media.uploaded.placeholderId,
            file,
          })
        }
      }

      continue
    }

    if (block.media.kind !== "uploaded") {
      continue
    }

    const file = uploadedFiles[block.media.uploaded.placeholderId]

    if (file) {
      files.push({
        placeholderId: block.media.uploaded.placeholderId,
        file,
      })
    }
  }

  return files.map((entry) => entry.file)
}

export function EditPostComposer({
  postId,
  initialBlocks,
  initialVisibility,
}: EditPostComposerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const errorPresentation = resolveCreatePostComposerErrorPresentation(error)

  return (
    <div className="space-y-4">
      {errorPresentation ? (
        <div className={errorPresentation.className}>
          {errorPresentation.message}
        </div>
      ) : null}

      <CreatePostForm
        isSubmitting={isPending}
        initialBlocks={initialBlocks}
        initialVisibility={initialVisibility}
        visibilityOptions={[initialVisibility]}
        showPublishMode={false}
        submitLabel="Save changes"
        resetAfterSubmit={false}
        onSubmitPost={({ visibility, blocks, uploadedFiles }) => {
          startTransition(async () => {
            try {
              setError(null)

              await updatePostAction({
                postId,
                visibility,
                files: collectUploadedFilesFromDraft(blocks, uploadedFiles),
                blocks,
              })
            } catch (submitError) {
              if (submitError instanceof Error) {
                if (submitError.message === "IMAGE_BLOCKED") {
                  setError(
                    "부적절한 이미지가 포함되어 있어 게시글을 수정할 수 없습니다."
                  )
                  return
                }

                setError(submitError.message)
                return
              }

              setError("Failed to update post")
            }
          })
        }}
      />
    </div>
  )
}
