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

export async function uploadTempStoryVideoToStorage(params: {
  storagePath: string
  fileBuffer: Buffer
  contentType: string
}) {
  const admin = createAdminClient()

  const { error } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .upload(params.storagePath, params.fileBuffer, {
      contentType: params.contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }
}

export async function downloadTempStoryVideoFromStorage(
  tempStoragePath: string
) {
  const admin = createAdminClient()

  const { data, error } = await admin.storage
    .from(STORIES_TEMP_BUCKET)
    .download(tempStoragePath)

  if (error || !data) {
    throw new Error(error?.message || "Failed to download temp story video")
  }

  return Buffer.from(await data.arrayBuffer())
}

export async function uploadProcessedStoryVideoToStorage(params: {
  storagePath: string
  localFileBuffer: Buffer
  contentType: string
}) {
  const admin = createAdminClient()

  const { error } = await admin.storage
    .from(STORIES_BUCKET)
    .upload(params.storagePath, params.localFileBuffer, {
      contentType: params.contentType,
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }
}

export async function removeTempStoryVideoFromStorage(
  tempStoragePath: string
) {
  const admin = createAdminClient()

  await admin.storage.from(STORIES_TEMP_BUCKET).remove([tempStoragePath])
}
