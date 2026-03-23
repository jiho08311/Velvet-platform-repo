"use client"

import { useState } from "react"

import { PostComposer } from "./PostComposer"

type CreatePostVisibility = "public" | "subscribers" | "paid"

type CreatePostFormValues = {
  text: string
  visibility: CreatePostVisibility
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

  async function handleSubmit() {
    await onSubmitPost({
      text: text.trim(),
      visibility,
    })
  }

  return (
    <PostComposer
      text={text}
      visibility={visibility}
      disabled={disabled || isSubmitting}
      onTextChange={setText}
      onVisibilityChange={setVisibility}
      onSubmit={handleSubmit}
    />
  )
}