import {
  buildPostRenderReadModel as buildPostRenderReadModelMapper,
  mapItemsToPostRenderMedia as mapItemsToPostRenderMediaMapper,
  mapPostBlockRowsToRenderBlocks as mapPostBlockRowsToRenderBlocksMapper,
} from "@/modules/post/mappers/post-render-read-model"

export const PUBLIC_CONTRACT = true

export type BuildPostRenderReadModelParams = Parameters<
  typeof buildPostRenderReadModelMapper
>[0]
export type BuildPostRenderReadModelResult = ReturnType<
  typeof buildPostRenderReadModelMapper
>
export type PostBlockRowsToRenderBlocksInput = Parameters<
  typeof mapPostBlockRowsToRenderBlocksMapper
>[0]
export type PostRenderMediaInput = Parameters<
  typeof mapItemsToPostRenderMediaMapper
>[0]

export function buildPostRenderReadModel(
  params: BuildPostRenderReadModelParams
): BuildPostRenderReadModelResult {
  return buildPostRenderReadModelMapper(params)
}

export function mapItemsToPostRenderMedia(
  items: PostRenderMediaInput
): BuildPostRenderReadModelResult["media"] {
  return mapItemsToPostRenderMediaMapper(items)
}

export function mapPostBlockRowsToRenderBlocks(
  rows: PostBlockRowsToRenderBlocksInput
): BuildPostRenderReadModelResult["blocks"] {
  return mapPostBlockRowsToRenderBlocksMapper(rows)
}
