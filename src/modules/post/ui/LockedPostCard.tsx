import type { ReactNode } from "react"
import { RestrictedFullCardShell } from "@/shared/ui/RestrictedFullCardShell"
import type { PostRenderInput } from "@/modules/post/types"

const LOCKED_FALLBACK_TEXT = "프리미엄 콘텐츠"

type LockedPostCardProps = {
  renderInput: Pick<
    PostRenderInput,
    "lockedPreviewText" | "primaryLockedPreviewMedia"
  >
  createdAt: string
  price?: number
  lockReason?: "subscription" | "purchase"
  action?: ReactNode
}

type LockedPostPresentation = {
  previewText: string
  previewThumbnailUrl: string | null
  isPaid: boolean
  formattedPrice: string | null
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount)
}

function resolveLockedPostPresentation({
  renderInput,
  price,
  lockReason,
}: Pick<
  LockedPostCardProps,
  "renderInput" | "price" | "lockReason"
>): LockedPostPresentation {
  const isPaid =
    lockReason === "purchase" &&
    typeof price === "number" &&
    price > 0

  return {
    previewText: renderInput.lockedPreviewText.trim(),
    previewThumbnailUrl:
      renderInput.primaryLockedPreviewMedia?.url?.trim() || null,
    isPaid,
    formattedPrice: isPaid ? formatPrice(price) : null,
  }
}

function renderBackdrop(previewThumbnailUrl: string | null) {
  return previewThumbnailUrl ? (
    <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
      <img
        src={previewThumbnailUrl}
        alt="콘텐츠 미리보기"
        className="h-full w-full scale-[1.06] object-cover opacity-30 blur-md"
      />
      <div className="absolute inset-0 bg-black/55" />
    </div>
  ) : (
    <div className="flex aspect-[4/5] items-center justify-center bg-zinc-950 text-sm text-zinc-500">
      {LOCKED_FALLBACK_TEXT}
    </div>
  )
}

function renderBadge() {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
      이용 필요
    </div>
  )
}

function renderOverlayContent({
  isPaid,
  formattedPrice,
  action,
}: Pick<LockedPostCardProps, "action"> &
  Pick<LockedPostPresentation, "formattedPrice" | "isPaid">) {
  return (
    <>
      <p className="text-lg font-semibold text-white">
        프리미엄 콘텐츠 이용
      </p>

      {isPaid ? (
        <p className="mt-2 text-base font-semibold text-white">
          ₩{formattedPrice}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          구독자만 볼 수 있는 콘텐츠입니다.
        </p>
      )}

      {action ? <div className="mt-4">{action}</div> : null}
    </>
  )
}

function renderFooter({
  previewText,
  createdAt,
}: Pick<LockedPostPresentation, "previewText"> &
  Pick<LockedPostCardProps, "createdAt">) {
  return (
    <>
      <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {previewText || LOCKED_FALLBACK_TEXT}
      </p>

      <p className="mt-4 text-xs text-zinc-500">{createdAt}</p>
    </>
  )
}

export function LockedPostCard({
  renderInput,
  createdAt,
  price,
  lockReason,
  action,
}: LockedPostCardProps) {
  const presentation = resolveLockedPostPresentation({
    renderInput,
    price,
    lockReason,
  })

  return (
    <RestrictedFullCardShell
      backdrop={renderBackdrop(presentation.previewThumbnailUrl)}
      badge={renderBadge()}
      overlayContent={renderOverlayContent({
        isPaid: presentation.isPaid,
        formattedPrice: presentation.formattedPrice,
        action,
      })}
      footer={renderFooter({
        previewText: presentation.previewText,
        createdAt,
      })}
    />
  )
}
