// src/modules/admin/public/list-creators.ts
import {
  listCreators as listCreatorsRuntime,
} from "@/modules/admin/runtime/list-creators"

export const PUBLIC_CONTRACT = true

export type AdminCreator = Awaited<ReturnType<typeof listCreatorsRuntime>>[number]

export async function listCreators(): Promise<AdminCreator[]> {
  return listCreatorsRuntime()
}
