import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const STORIES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "media"
const STORIES_TEMP_BUCKET =
  process.env.STORIES_TEMP_BUCKET ?? "media-temp"

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables")
}

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export async function uploadTempStoryVideo(params: {
  creatorId: string
  file: File
}) {
  const admin = createAdminClient()
  const ext = getFileExtension(params.file.name, params.file.type)
  const storagePath = `${params.creatorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`
  const fileBuffer = Buffer.from(await params.file.arrayBuffer())

  const { error } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: params.file.type || "video/mp4",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return storagePath
}

export async function downloadTempStoryVideo(tempStoragePath: string) {
  const admin = createAdminClient()

  const { data, error } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .download(tempStoragePath)

  if (error || !data) {
    throw new Error(error?.message || "Failed to download temp story video")
  }

  return Buffer.from(await data.arrayBuffer())
}

export async function uploadProcessedStoryVideo(params: {
  creatorId: string
  localFileBuffer: Buffer
  contentType?: string
}) {
  const admin = createAdminClient()
  const storagePath = `${params.creatorId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.mp4`

  const { error } = await admin.storage
    .from(STORIES_BUCKET)
    .upload(storagePath, params.localFileBuffer, {
      contentType: params.contentType ?? "video/mp4",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return storagePath
}

export async function removeTempStoryVideo(tempStoragePath: string) {
  const admin = createAdminClient()

  await admin.storage.from(STORIES_TEMP_BUCKET).remove([tempStoragePath])
}

function getFileExtension(fileName: string, mimeType: string) {
  const byName = fileName.split(".").pop()?.toLowerCase()

  if (byName && byName.length <= 5) {
    return byName
  }

  if (mimeType.includes("quicktime")) {
    return "mov"
  }

  return "mp4"
}
