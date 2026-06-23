import {
  executeCreatorAuthorityCreation as executeCreatorAuthorityCreationRuntime,
} from "@/modules/identity/runtime/execute-creator-authority-creation-runtime"
import {
  executeCreatorConfigurationUpdate as executeCreatorConfigurationUpdateRuntime,
} from "@/modules/identity/runtime/execute-creator-configuration-update-runtime"

export const PUBLIC_CONTRACT = true

export type ExecuteCreatorAuthorityCreationInput = Parameters<
  typeof executeCreatorAuthorityCreationRuntime
>[0]
export type ExecuteCreatorAuthorityCreationResult = Awaited<
  ReturnType<typeof executeCreatorAuthorityCreationRuntime>
>
export type CreatorAuthorityCreationData =
  ExecuteCreatorAuthorityCreationResult["data"]

export type ExecuteCreatorConfigurationUpdateInput = Parameters<
  typeof executeCreatorConfigurationUpdateRuntime
>[0]
export type ExecuteCreatorConfigurationUpdateResult = Awaited<
  ReturnType<typeof executeCreatorConfigurationUpdateRuntime>
>

export async function executeCreatorAuthorityCreation(
  input: ExecuteCreatorAuthorityCreationInput
): Promise<ExecuteCreatorAuthorityCreationResult> {
  return executeCreatorAuthorityCreationRuntime(input)
}

export async function executeCreatorConfigurationUpdate(
  input: ExecuteCreatorConfigurationUpdateInput
): Promise<ExecuteCreatorConfigurationUpdateResult> {
  return executeCreatorConfigurationUpdateRuntime(input)
}
