"use client"

import { Button } from "@/shared/ui/Button"
import type { resolveSubscribeCTA } from "@/shared/ui/cta-state"

type SubscribeButtonViewProps = {
  cta: ReturnType<typeof resolveSubscribeCTA>
  checking: boolean
  isOwner: boolean
  subscribed: boolean
  cancelAtPeriodEnd: boolean
  embedded: boolean
  errorMessage: string
  cancelAtPeriodEndMessage: string
  onSubscribe: () => void
  onCancel: () => void
}

export function SubscribeButtonView({
  cta,
  checking,
  isOwner,
  subscribed,
  cancelAtPeriodEnd,
  embedded,
  errorMessage,
  cancelAtPeriodEndMessage,
  onSubscribe,
  onCancel,
}: SubscribeButtonViewProps) {
  if (checking || isOwner) {
    return (
      <Button
        variant={cta.primary.variant}
        disabled={cta.primary.disabled}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded
        className={
          isOwner
            ? "bg-zinc-800 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            : undefined
        }
      >
        {cta.primary.label}
      </Button>
    )
  }

  if (subscribed) {
    return (
      <div className="flex w-full flex-col gap-2">
        <Button
          variant={cta.primary.variant}
          disabled={cta.primary.disabled}
          fullWidth
          className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-950"
        >
          {cta.primary.label}
        </Button>

        {cta.secondary ? (
          <Button
            type="button"
            onClick={onCancel}
            variant={cta.secondary.variant}
            loading={cta.secondary.loading}
            loadingLabel={cta.secondary.loadingLabel}
          >
            {cta.secondary.label}
          </Button>
        ) : null}

        {cancelAtPeriodEnd ? (
          <p className="text-center text-xs text-zinc-500">
            {cancelAtPeriodEndMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="text-center text-xs text-red-400">{errorMessage}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full">
      <Button
        onClick={onSubscribe}
        loading={cta.primary.loading}
        loadingLabel={cta.primary.loadingLabel}
        embedded={embedded}
        fullWidth={!embedded}
      >
        {cta.primary.label}
      </Button>

      {errorMessage ? (
        <p className="mt-2 text-center text-xs text-red-400">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
