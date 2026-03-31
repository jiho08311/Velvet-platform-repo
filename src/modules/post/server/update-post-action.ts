"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { getCurrentUser } from "@/modules/auth/server/get-current-user"
import { getCreatorByUserId } from "@/modules/creator/server/get-creator-by-user-id"
import { createMedia } from "@/modules/media/server/create-media"
import { uploadMedia } from "@/modules/media/server/upload-media"
import { updatePost } from "@/modules/post/server/update-post"

type UpdatePostActionInput = {
  postId: string
  text: string
  visibility: "public" | "subscribers" | "paid"
  priceCents?: number
  files?: File[]
  removedMediaIds?: string[]
}

type MediaRow = {
  id: string
  storage_path: string
}

function resolveMediaType(file: File): "image" | "video" | "audio" | "file" {
  const mime = file.type || ""

  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"

  return "file"
}

export async function updatePostAction({
  postId,
  text,
  visibility,
  priceCents = 0,
  files = [],
  removedMediaIds = [],
}: UpdatePostActionInput) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/sign-in?next=/post/${postId}/edit`)
  }

  const creator = await getCreatorByUserId(user.id)

  if (!creator) {
    throw new Error("Creator not found")
  }

  if (visibility === "paid" && priceCents <= 0) {
    throw new Error("Paid post price must be greater than 0")
  }

  await updatePost({
    postId,
    creatorId: creator.id,
    content: text.trim() || null,
    visibility,
    priceCents: visibility === "paid" ? priceCents : 0,
  })

  const validRemovedMediaIds = removedMediaIds
    .map((id) => id.trim())
    .filter((id) => id.length > 0)

  if (validRemovedMediaIds.length > 0) {
    const { data: mediaToDelete, error: mediaToDeleteError } = await supabaseAdmin
      .from("media")
      .select("id, storage_path")
      .eq("post_id", postId)
      .in("id", validRemovedMediaIds)
      .returns<MediaRow[]>()

    if (mediaToDeleteError) {
      throw mediaToDeleteError
    }

    const storagePaths = (mediaToDelete ?? [])
      .map((media) => media.storage_path)
      .filter((path) => typeof path === "string" && path.length > 0)

    if (storagePaths.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"

      const { error: storageDeleteError } = await supabaseAdmin.storage
        .from(bucket)
        .remove(storagePaths)

      if (storageDeleteError) {
        throw storageDeleteError
      }
    }

    const { error: deleteMediaRowsError } = await supabaseAdmin
      .from("media")
      .delete()
      .eq("post_id", postId)
      .in("id", validRemovedMediaIds)

    if (deleteMediaRowsError) {
      throw deleteMediaRowsError
    }
  }

  const validFiles = files.filter((file) => file instanceof File && file.size > 0)

  if (validFiles.length > 0) {
    const { count, error: countError } = await supabaseAdmin
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("post_id", postId)

    if (countError) {
      throw countError
    }

    const startSortOrder = count ?? 0

    for (const [index, file] of validFiles.entries()) {
      const storagePath = await uploadMedia({
        uploaderUserId: user.id,
        file,
        purpose: "post",
      })

      await createMedia({
        postId,
        ownerUserId: user.id,
        type: resolveMediaType(file),
        storagePath,
        mimeType: file.type || undefined,
        sortOrder: startSortOrder + index,
        status: "ready",
      })
    }
  }

  revalidatePath("/feed")
  revalidatePath(`/post/${postId}`)
  revalidatePath(`/post/${postId}/edit`)
  revalidatePath(`/creator/${creator.username}`)
  revalidatePath("/profile")

  redirect(`/post/${postId}`)
}