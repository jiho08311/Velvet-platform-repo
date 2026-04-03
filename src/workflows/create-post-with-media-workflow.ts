import OpenAI from "openai"
import { supabaseAdmin } from "@/infrastructure/supabase/admin"
import { createPost } from "@/modules/post/server/create-post"
import { uploadMedia } from "@/modules/media/server/upload-media"
import { createMedia } from "@/modules/media/server/create-media"
import { updatePostStatus } from "@/modules/post/server/update-post-status"
import { processVideoModeration } from "./process-video-moderation"
import { enqueueVideoModeration } from "@/modules/moderation/server/enqueue-video-moderation"
type CreatePostWithMediaWorkflowInput = {
  creatorId: string
  title?: string | null
  content?: string | null
  status?: "draft" | "published" | "archived"
  visibility?: "public" | "subscribers" | "paid"
  price?: number
  files: File[]
}

type MediaType = "image" | "video" | "audio" | "file"

type CreatedMedia = {
  id: string
  type: MediaType
  storagePath: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const KOREAN_BAD_WORDS = [
  "씨발",
  "시발",
  "ㅅㅂ",
  "ㅆㅂ",
  "병신",
  "븅신",
  "ㅂㅅ",
  "좆",
  "좃",
  "ㅈ같",
  "ㅈㄹ",
  "지랄",
  "지1랄",
  "지럴",
  "개새끼",
  "개새",
  "개새끼야",
  "꺼져",
  "닥쳐",
  "닥쳐라",
  "섹스",
  "sex",
  "야스",
  "보지",
  "자지",
  "좆집",
  "딸딸이",
  "딸치",
  "자위",
  "음란",
  "야동",
  "porn",
  "nude",
  "누드",
  "알몸",
  "강간",
  "성폭행",
  "성추행",
  "죽여",
  "죽인다",
  "죽고싶",
  "죽을래",
  "살인",
  "패버린다",
  "쳐죽",
  "맞아죽",
  "칼로",
  "총으로",
  "죽여버",
  "멍청이",
  "바보새끼",
  "또라이",
  "정신병자",
  "미친놈",
  "미친년",
  "개같은",
  "쓰레기",
  "인간쓰레기",
  "벌레같은",
  "역겨운",
  "ㅅㅅ",
  "ㅂㅈ",
  "ㅈㅈ",
  "ㅁㅊ",
  "미쳤",
  "개같",
  "좆같",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "노출",
  "유두",
  "가슴",
  "엉덩이",
  "성기",
  "클리",
  "음경",
]

function containsBadWords(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "")

  return KOREAN_BAD_WORDS.some((word) => normalized.includes(word))
}

function getMediaType(file: File): MediaType {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  if (file.type.startsWith("audio/")) return "audio"
  return "file"
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function checkTextSafety(text?: string | null) {
  const resolvedText = text?.trim() ?? ""

  if (!resolvedText) return

  if (containsBadWords(resolvedText)) {
    throw new Error("TEXT_BLOCKED")
  }

  for (const delay of [0, 800, 1600]) {
    if (delay > 0) await sleep(delay)

    try {
      const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: resolvedText,
      })

      const result = response.results?.[0]

      if (!result) throw new Error("Failed to moderate text")
      if (result.flagged) throw new Error("TEXT_BLOCKED")

      return
    } catch (error: any) {
      if (error?.status !== 429) throw error
    }
  }

  throw new Error("Text moderation temporarily unavailable")
}

async function checkImageSafety(file: File) {
  if (!(file instanceof File)) {
    throw new Error("Image file is required")
  }

  if (!file.type.startsWith("image/")) return

  for (const delay of [0, 800, 1600]) {
    if (delay > 0) await sleep(delay)

    try {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")

      const response = await openai.moderations.create({
        model: "omni-moderation-latest",
        input: [
          {
            type: "image_url",
            image_url: {
              url: `data:${file.type};base64,${base64}`,
            },
          },
        ],
      })

      const result = response.results?.[0]

      if (!result) throw new Error("Failed to moderate image")
      if (result.flagged) throw new Error("IMAGE_BLOCKED")

      return
    } catch (error: any) {
      if (error?.status !== 429) throw error
    }
  }

  throw new Error("Image moderation temporarily unavailable")
}

async function checkPostSafety({
  text,
  files,
}: {
  text?: string | null
  files: File[]
}) {
  await checkTextSafety(text)

  for (const file of files) {
    await checkImageSafety(file)
  }
}

async function moderatePostAsync({
  postId,
  content,
  files,
}: {
  postId: string
  content?: string | null
  files: File[]
}) {
  try {
    await checkPostSafety({
      text: content,
      files,
    })
  } catch (error) {
    console.error("[moderation] blocked:", error)

    await updatePostStatus({
      postId,
      status: "archived",
    })

    await supabaseAdmin
      .from("posts")
      .update({
        visibility_status: "rejected",
        moderation_status: "rejected",
        moderation_completed_at: new Date().toISOString(),
      })
      .eq("id", postId)
  }
}

export async function createPostWithMediaWorkflow({
  creatorId,
  title,
  content,
  status = "draft",
  visibility = "subscribers",
  price = 0,
  files,
}: CreatePostWithMediaWorkflowInput) {
  const resolvedprice = visibility === "paid" ? price : 0

  console.log(
    "[createPostWithMediaWorkflow] files",
    files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }))
  )

  const hasVideo = files.some((file) => getMediaType(file) === "video")

  console.log("[createPostWithMediaWorkflow] hasVideo", hasVideo)

  const post = await createPost({
    creatorId,
    title,
    content,
    status: hasVideo ? "draft" : status,
    visibility,
    price: resolvedprice,
  })

  if (hasVideo) {
    await supabaseAdmin
      .from("posts")
      .update({
        visibility_status: "processing",
        moderation_status: "pending",
      })
      .eq("id", post.id)
  }

  const media: CreatedMedia[] = []

  for (const [index, file] of files.entries()) {
    const type = getMediaType(file)

    console.log("[createPostWithMediaWorkflow] detected media type", {
      name: file.name,
      fileType: file.type,
      detectedType: type,
    })

    const storagePath = await uploadMedia({
      uploaderUserId: creatorId,
      file,
    })

    const mediaRow = await createMedia({
      postId: post.id,
      type,
      storagePath,
      mimeType: file.type || undefined,
      sortOrder: index,
      status: type === "video" ? "processing" : "ready",
    })

    if (type === "video") {
      await supabaseAdmin
        .from("media")
        .update({
          processing_status: "processing",
          moderation_status: "pending",
          moderation_summary: null,
        })
        .eq("id", mediaRow.id)
    }

    media.push({
      id: mediaRow.id,
      type: mediaRow.type,
      storagePath: mediaRow.storagePath,
    })
  }

  void moderatePostAsync({
    postId: post.id,
    content,
    files,
  })

  if (hasVideo) {
    console.log("🔥 CALL processVideoModeration", {
      postId: post.id,
      media,
    })

    await enqueueVideoModeration({
  postId: post.id,
  media,
})
  }

  return {
    post,
    media,
  }
}