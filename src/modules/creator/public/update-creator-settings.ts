import {
  updateCreatorSettings as updateCreatorSettingsRuntime,
} from "@/modules/creator/runtime/update-creator-settings"

export const PUBLIC_CONTRACT = true

export type UpdateCreatorSettingsInput = Parameters<typeof updateCreatorSettingsRuntime>[0]
export type UpdateCreatorSettingsResult = Awaited<
  ReturnType<typeof updateCreatorSettingsRuntime>
>

export function updateCreatorSettings(
  input: UpdateCreatorSettingsInput
): ReturnType<typeof updateCreatorSettingsRuntime> {
  return updateCreatorSettingsRuntime(input)
}
