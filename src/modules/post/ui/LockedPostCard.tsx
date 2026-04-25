import { RestrictedFullCardShell } from "@/shared/ui/RestrictedFullCardShell"
import type { PostRenderInput } from "@/modules/post/types"

type LockedPostCardProps = {
  renderInput?: Pick<
    PostRenderInput,
    "lockedPreviewText" | "primaryLockedPreviewMedia"
  >
  previewText?: string
  createdAt: string
  previewThumbnailUrl?: string | null
  price?: number
  lockReason?: "subscription" | "purchase"
  action?: React.ReactNode
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

function resolveLockedPreviewText(params: {
  renderInput?: Pick<PostRenderInput, "lockedPreviewText">
  previewText?: string
}) {
  const textFromRenderInput = normalizeText(params.renderInput?.lockedPreviewText)

  if (textFromRenderInput.length > 0) {
    return textFromRenderInput
  }

  return normalizeText(params.previewText)
}

function resolveLockedPreviewThumbnailUrl(params: {
  renderInput?: Pick<PostRenderInput, "primaryLockedPreviewMedia">
  previewThumbnailUrl?: string | null
}) {
  const mediaUrl = params.renderInput?.primaryLockedPreviewMedia?.url?.trim() ?? ""

  if (mediaUrl.length > 0) {
    return mediaUrl
  }

  const fallbackUrl = params.previewThumbnailUrl?.trim() ?? ""
  return fallbackUrl.length > 0 ? fallbackUrl : null
}

export function LockedPostCard({
  renderInput,
  previewText = "",
  createdAt,
  previewThumbnailUrl = null,
  price,
  lockReason,
  action,
}: LockedPostCardProps) {
  const resolvedPreviewText = resolveLockedPreviewText({
    renderInput,
    previewText,
  })

  const resolvedPreviewThumbnailUrl = resolveLockedPreviewThumbnailUrl({
    renderInput,
    previewThumbnailUrl,
  })

  const isPaid =
    lockReason === "purchase" &&
    typeof price === "number" &&
    price > 0

  const backdrop = resolvedPreviewThumbnailUrl ? (
    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
      <img
        src={resolvedPreviewThumbnailUrl}
        alt="콘텐츠 미리보기"
        className="h-full w-full scale-[1.06] object-cover opacity-30 blur-md"
      />
      <div className="absolute inset-0 bg-black/55" />
    </div>
  ) : (
    <div className="flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500">
      프리미엄 콘텐츠
    </div>
  )

  const badge = (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
      이용 필요
    </div>
  )

  const overlayContent = (
    <>
      <p className="text-lg font-semibold text-white">
        프리미엄 콘텐츠 이용
      </p>

      {isPaid ? (
        <p className="mt-2 text-base font-semibold text-white">
          ₩{formatPrice(price)}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          구독자만 볼 수 있는 콘텐츠입니다.
        </p>
      )}

      {action ? <div className="mt-4">{action}</div> : null}
    </>
  )

  const footer = (
    <>
      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {resolvedPreviewText || "프리미엄 콘텐츠"}
      </p>

      <p className="mt-4 text-xs text-zinc-500">{createdAt}</p>
    </>
  )

  return (
    <RestrictedFullCardShell
      backdrop={backdrop}
      badge={badge}
      overlayContent={overlayContent}
      footer={footer}
    />
  )
}