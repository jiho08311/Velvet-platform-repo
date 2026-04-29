export const CREATOR_SURFACE_EMPTY_STATE = {
  page: {
    title: "No posts yet",
    description: "Posts will appear here once they are created.",
  },
  postsTab: {
    title: "No posts yet",
    description: "Posts will appear here once they are created.",
  },
  updatesTab: {
    title: "No updates yet",
    description: "Updates will appear here once they are created.",
  },
} as const

export const CREATOR_CONTENT_TAB_LABELS = {
  posts: "Posts",
  updates: "Updates",
} as const

export function getCreatorContentVisibilityLabel(visibility?: string | null) {
  if (visibility === "public") {
    return "Public"
  }

  if (visibility === "subscribers") {
    return "Subscribers"
  }

  if (visibility === "paid") {
    return "Paid"
  }

  return "Post"
}

export function getCreatorUpdateHeaderBadge(status?: string | null) {
  if (status === "scheduled") {
    return {
      label: "Upcoming",
      tone: "info" as const,
    }
  }

  if (status === "draft") {
    return {
      label: "Draft",
      tone: "neutral" as const,
    }
  }

  return {
    label: "Update",
    tone: "subtle" as const,
  }
}

export type CreatorUpdateSurfaceVariant =
  | "locked"
  | "upcoming"
  | "draft"
  | "default"

export const CREATOR_UPDATE_SURFACE_CLASS_NAMES = {
  card: {
    locked:
      "group rounded-3xl border border-zinc-700 bg-zinc-950/90 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900",
    upcoming:
      "group rounded-3xl border border-[#C2185B]/25 bg-zinc-950/85 p-5 transition-all hover:border-[#C2185B]/40 hover:bg-zinc-900/95",
    draft:
      "group rounded-3xl border border-zinc-700/80 bg-zinc-950/80 p-5 transition-all hover:border-zinc-600 hover:bg-zinc-900/90",
    default:
      "group rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-900/90",
  },
  footerDot: {
    locked: "bg-zinc-500",
    upcoming: "bg-[#C2185B]",
    draft: "bg-zinc-500",
    default: "bg-zinc-600",
  },
} satisfies {
  card: Record<CreatorUpdateSurfaceVariant, string>
  footerDot: Record<CreatorUpdateSurfaceVariant, string>
}

export function getCreatorUpdateSurfaceVariant(input: {
  status?: string | null
  isLocked: boolean
}): CreatorUpdateSurfaceVariant {
  if (input.isLocked) {
    return "locked"
  }

  if (input.status === "scheduled") {
    return "upcoming"
  }

  if (input.status === "draft") {
    return "draft"
  }

  return "default"
}

export function getCreatorUpdatePreviewText(input: {
  status?: string | null
  isLocked: boolean
  isOwner: boolean
  content?: string | null
}) {
  const isUpcoming = input.status === "scheduled"

  if (isUpcoming && !input.isOwner) {
    return "Upcoming post"
  }

  if (input.isLocked) {
    return "Subscribe to read this update."
  }

  return input.content?.trim() || "No content"
}

export type CreatorRestrictedSurfaceState = "locked" | "upcoming"

export function getCreatorRestrictedSurfaceState(
  state: CreatorRestrictedSurfaceState
) {
  if (state === "locked") {
    return {
      badgeLabel: "Locked",
      badgeTone: "subtle" as const,
      title: "Subscribe to unlock this content.",
      description: "Preview is limited until access is granted.",
      className: "rounded-2xl border-white/10 bg-white/[0.03] p-4",
    }
  }

  return {
    badgeLabel: "Upcoming",
    badgeTone: "info" as const,
    title: "This content is scheduled.",
    description: "It will be available once published.",
    className: "rounded-2xl border-[#C2185B]/15 bg-[#C2185B]/[0.06] p-4",
  }
}

export type CreatorSubscriptionDisplayStatus =
  | "active"
  | "canceled"
  | "expired"
  | "inactive"

export function getCreatorSubscriptionStatusState(
  status: CreatorSubscriptionDisplayStatus,
  formattedEndDate?: string | null
) {
  if (status === "inactive") {
    return {
      tone: "neutral" as const,
      badgeLabel: "Inactive",
      badgeTone: "subtle" as const,
      title: "구독이 필요합니다",
      description:
        "구독하면 크리에이터의 전용 콘텐츠를 확인할 수 있습니다.",
    }
  }

  if (status === "expired") {
    return {
      tone: "danger" as const,
      badgeLabel: "Expired",
      badgeTone: "danger" as const,
      title: "구독이 종료되었습니다",
      description: formattedEndDate
        ? `${formattedEndDate}에 이용이 종료되었습니다. 다시 구독하면 전용 콘텐츠를 계속 확인할 수 있습니다.`
        : "이용이 종료되었습니다. 다시 구독하면 전용 콘텐츠를 계속 확인할 수 있습니다.",
    }
  }

  if (status === "canceled") {
    return {
      tone: "warning" as const,
      badgeLabel: "Canceled",
      badgeTone: "warning" as const,
      title: "구독 종료 예정",
      description: formattedEndDate
        ? `${formattedEndDate}까지 전용 콘텐츠를 이용할 수 있습니다.`
        : "현재 결제 주기 종료 시 이용이 종료됩니다.",
    }
  }

  return {
    tone: "success" as const,
    badgeLabel: "Active",
    badgeTone: "success" as const,
    title: "구독 중",
    description: formattedEndDate
      ? `다음 결제 기준일은 ${formattedEndDate}입니다.`
      : "현재 전용 콘텐츠를 이용할 수 있습니다.",
  }
}

export function getCreatorSubscriptionPresentation(displayName: string) {
  return {
    pricePeriodLabel: "monthly subscription",
    unlockDescription: `Subscribe to unlock posts, updates, and subscriber-only content from ${displayName}.`,
    cancelAtPeriodEndMessage: "이번 결제 주기 종료 후 자동으로 해지됩니다",
    subscribeFallbackError: "구독 처리에 실패했습니다",
    cancelFallbackError: "구독 종료에 실패했습니다",
  }
}

export const CREATOR_PAGE_PRESENTATION = {
  ownerEditLabel: "Edit profile",
  bioFallback: "No bio yet.",
  stats: {
    posts: "Posts",
    updates: "Updates",
    subscribers: "Subscribers",
  },
} as const
