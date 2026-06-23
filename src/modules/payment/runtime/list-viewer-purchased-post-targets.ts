import {
  listViewerPurchasedPostTargetRows,
  type ViewerPurchasedPostTargetRow,
} from "@/modules/payment/repositories/payment-read-repository"

type ListViewerPurchasedPostTargetsInput = {
  viewerUserId: string
  postIds: string[]
}

export type ViewerPurchasedPostTarget = ViewerPurchasedPostTargetRow

export async function listViewerPurchasedPostTargets({
  viewerUserId,
  postIds,
}: ListViewerPurchasedPostTargetsInput): Promise<ViewerPurchasedPostTarget[]> {
  const rows = await listViewerPurchasedPostTargetRows({
    viewerUserId,
    postIds,
  })

  return rows ?? []
}