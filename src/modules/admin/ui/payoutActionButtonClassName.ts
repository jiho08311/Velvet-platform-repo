const payoutActionButtonBaseClassName =
  "rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export function getPayoutActionButtonClassName(toneClassName: string) {
  return `${payoutActionButtonBaseClassName} ${toneClassName}`;
}
