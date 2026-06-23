import type { CreatorContentTabPost } from "./creator-content-tabs-types"
import {
  CREATOR_UPDATE_SURFACE_CLASS_NAMES,
  getCreatorContentVisibilityLabel,
  getCreatorRestrictedSurfaceState,
  getCreatorUpdateHeaderBadge,
  getCreatorUpdatePreviewText,
  getCreatorUpdateSurfaceVariant,
} from "./creator-surface-policy"

export type UpdateSurfaceState = {
  isLocked: boolean
  isUpcoming: boolean
  isDraft: boolean
  visibilityLabel: string
  statusLabel: string
  statusTone: "info" | "neutral" | "subtle"
  previewText: string
  metaLabel: string
  cardClassName: string
  footerDotClassName: string
}

export type UpdateRestrictedCallout = {
  badgeLabel: string
  badgeTone: "subtle" | "info"
  title: string
  description: string
  className: string
}

export function getUpdateRestrictedCallout(
  type: "locked" | "upcoming"
): UpdateRestrictedCallout {
  const state = getCreatorRestrictedSurfaceState(type)

  return {
    badgeLabel: state.badgeLabel,
    badgeTone: state.badgeTone,
    title: state.title,
    description: state.description,
    className: state.className,
  }
}

export function getPostTileState(
  post: CreatorContentTabPost,
  isOwner: boolean
) {
  const mediaCount = post.renderInput.blockMedia.length || post.media?.length || 0

  return {
    isLocked: Boolean(post.isLocked),
    isDraft: isOwner && post.status === "draft",
    extraMediaCount: Math.max(mediaCount - 1, 0),
    media: post.renderInput.primaryLockedPreviewMedia ?? post.media?.[0],
  }
}

export function getUpdateSurfaceState(
  post: CreatorContentTabPost,
  isOwner: boolean
): UpdateSurfaceState {
  const isUpcoming = post.status === "scheduled"
  const isDraft = post.status === "draft"
  const isLocked = Boolean(post.isLocked)
  const surfaceVariant = getCreatorUpdateSurfaceVariant({
    status: post.status,
    isLocked,
  })
  const headerBadge = getCreatorUpdateHeaderBadge(post.status)
  const previewText = getCreatorUpdatePreviewText({
    status: post.status,
    isLocked,
    isOwner,
    content: post.renderInput.blockText || post.content,
  })

  const formattedDate = isUpcoming
    ? formatDate(post.publishedAt)
    : formatDate(post.createdAt)

  return {
    isLocked,
    isUpcoming,
    isDraft,
    visibilityLabel: getCreatorContentVisibilityLabel(post.visibility),
    statusLabel: headerBadge.label,
    statusTone: headerBadge.tone,
    previewText,
    metaLabel: isUpcoming
      ? `Scheduled · ${formattedDate || "TBA"}`
      : `Posted · ${formattedDate || "-"}`,
    cardClassName: CREATOR_UPDATE_SURFACE_CLASS_NAMES.card[surfaceVariant],
    footerDotClassName:
      CREATOR_UPDATE_SURFACE_CLASS_NAMES.footerDot[surfaceVariant],
  }
}

function formatDate(value?: string | null) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleDateString()
}
