import {
  canPromotePostCanonicalAuthority,
} from "@/modules/post/repositories/post-cutover-authority-repository"

export type ContentServingAuthorityMode =
  | "legacy"
  | "canonical"
  | "dual_read"
  | "shadow"

export async function resolveContentServingAuthorityRuntime(input: {
  runtimeSurface: string
  authoritySurface?: string
}): Promise<{
  authorityMode: ContentServingAuthorityMode
  useCanonical: boolean
  useLegacyFallback: boolean
  promotionAllowed: boolean
  rollbackSafe: boolean
  failOpen: boolean
}> {
  const { data, error } = await canPromotePostCanonicalAuthority({
    runtimeSurface: input.runtimeSurface,
    authoritySurface: input.authoritySurface,
  })

  if (error || !data) {
    return {
      authorityMode: "legacy",
      useCanonical: false,
      useLegacyFallback: true,
      promotionAllowed: false,
      rollbackSafe: true,
      failOpen: true,
    }
  }

  const authorityMode =
    data.authorityMode === "canonical" ||
    data.authorityMode === "dual_read" ||
    data.authorityMode === "shadow" ||
    data.authorityMode === "legacy"
      ? data.authorityMode
      : "legacy"

  return {
    authorityMode,
    useCanonical:
      authorityMode === "canonical" ||
      authorityMode === "dual_read" ||
      authorityMode === "shadow",
    useLegacyFallback:
      authorityMode === "legacy" ||
      authorityMode === "dual_read" ||
      !data.promotionAllowed,
    promotionAllowed: data.promotionAllowed,
    rollbackSafe: data.rollbackSafe,
    failOpen: data.failOpen,
  }
}