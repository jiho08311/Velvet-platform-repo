"use client"

import { useMemo, useState } from "react"

import { PostComposer } from "./PostComposer"

type CreatePostVisibility = "public" | "subscribers" | "paid"

type CreatePostFormValues = {
  text: string
  visibility: CreatePostVisibility
  isLocked: boolean
}

type CreatePostFormProps = {
  disabled?: boolean
  isSubmitting?: boolean
  onSubmitPost: (values: CreatePostFormValues) => Promise<void> | void
}

export function CreatePostForm({
  disabled = false,
  isSubmitting = false,
  onSubmitPost,
}: CreatePostFormProps) {
  const [text, setText] = useState("")
  const [visibility, setVisibility] =
    useState<CreatePostVisibility>("subscribers")
  const [isLocked, setIsLocked] = useState(false)

  const resolvedVisibility = useMemo<CreatePostVisibility>(() => {
    if (isLocked && visibility === "public") {
      return "subscribers"
    }

    return visibility
  }, [isLocked, visibility])

  async function handleSubmit() {
    await onSubmitPost({
      text: text.trim(),
      visibility: resolvedVisibility,
      isLocked,
    })
  }

  return (
    <PostComposer
      text={text}
      visibility={resolvedVisibility}
      isLocked={isLocked}
      disabled={disabled || isSubmitting}
      onTextChange={setText}
      onVisibilityChange={setVisibility}
      onLockedChange={setIsLocked}
      onSubmit={handleSubmit}
    />
  )
}