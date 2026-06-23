import {
  listViewerPurchasedPostTargets as listViewerPurchasedPostTargetsRuntime,
} from "@/modules/payment/runtime/list-viewer-purchased-post-targets"

export const PUBLIC_CONTRACT = true

export type ListViewerPurchasedPostTargetsInput = Parameters<
  typeof listViewerPurchasedPostTargetsRuntime
>[0]

export type ViewerPurchasedPostTarget = Awaited<
  ReturnType<typeof listViewerPurchasedPostTargetsRuntime>
>[number]

export async function listViewerPurchasedPostTargets(
  input: ListViewerPurchasedPostTargetsInput
): Promise<ViewerPurchasedPostTarget[]> {
  return listViewerPurchasedPostTargetsRuntime(input)
}
