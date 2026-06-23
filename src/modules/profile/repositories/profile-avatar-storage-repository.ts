import { createClient } from "@/infrastructure/supabase/server"

function sanitizeAvatarFileName(fileName: string) {
  const extension = fileName.includes(".")
    ? fileName.split(".").pop()?.toLowerCase() ?? "png"
    : "png"

  return `avatar.${extension.replace(/[^a-z0-9]/g, "") || "png"}`
}

export async function uploadProfileAvatar(input: {
  userId: string
  file: File
  uploadedAt?: number
}): Promise<string> {
  const supabase = await createClient()
  const safeFileName = sanitizeAvatarFileName(input.file.name)
  const filePath = `${input.userId}/${input.uploadedAt ?? Date.now()}-${safeFileName}`

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, input.file, { upsert: true })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
  return data.publicUrl
}
