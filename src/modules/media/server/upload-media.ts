import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UploadMediaInput = {
  creatorId: string
  file: File
}

export async function uploadMedia({
  creatorId,
  file,
}: UploadMediaInput): Promise<string> {
  const id = creatorId.trim()

  if (!id) {
    throw new Error("creatorId is required")
  }

  const fileExtension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "bin"
    : "bin"

  const fileName = `${crypto.randomUUID()}.${fileExtension}`
  const storagePath = `${id}/${fileName}`

  const { error } = await supabaseAdmin.storage
    .from("post-media")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (error) {
    throw error
  }

  return storagePath
}