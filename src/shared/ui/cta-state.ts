type CTAState = {
  label: string
  variant?: "primary" | "secondary" | "danger"
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

/* ----------------------------- */
/* Subscribe CTA */
/* ----------------------------- */

type ResolveSubscribeCTAInput = {
  checking: boolean
  isOwner: boolean
  subscribed: boolean
  cancelAtPeriodEnd: boolean
  loading: boolean
}

export function resolveSubscribeCTA(
  input: ResolveSubscribeCTAInput
): {
  primary: CTAState
  secondary?: CTAState
} {
  if (input.checking) {
    return {
      primary: {
        label: "확인 중...",
        loading: true,
        loadingLabel: "확인 중...",
      },
    }
  }

  if (input.isOwner) {
    return {
      primary: {
        label: "내 페이지",
        variant: "secondary",
        disabled: true,
      },
    }
  }

  if (input.subscribed) {
    if (input.cancelAtPeriodEnd) {
      return {
        primary: {
          label: "구독 종료 예정",
          variant: "secondary",
          disabled: true,
        },
      }
    }

    return {
      primary: {
        label: "구독 중",
        variant: "secondary",
        disabled: true,
      },
      secondary: {
        label: "구독 취소",
        variant: "danger",
        loading: input.loading,
        loadingLabel: "처리 중...",
      },
    }
  }

  return {
    primary: {
      label: "구독하기",
      loading: input.loading,
      loadingLabel: "처리 중...",
    },
  }
}

/* ----------------------------- */
/* Purchase CTA */
/* ----------------------------- */

type ResolvePurchaseCTAInput = {
  loading: boolean
}

export function resolvePurchaseCTA(
  input: ResolvePurchaseCTAInput
): {
  primary: CTAState
} {
  return {
    primary: {
      label: "이용권 구매",
      loading: input.loading,
      loadingLabel: "처리 중...",
    },
  }
}

/* ----------------------------- */
/* Feed Composer CTA */
/* ----------------------------- */

type ResolveComposerCTAInput = {
  loading: boolean
  disabled: boolean
}

export function resolveComposerCTA(
  input: ResolveComposerCTAInput
): {
  primary: CTAState
} {
  return {
    primary: {
      label: "Post",
      disabled: input.disabled,
      loading: input.loading,
      loadingLabel: "Posting...",
    },
  }
}