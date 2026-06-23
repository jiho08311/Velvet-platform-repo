import {
  uploadProfileAvatar as uploadProfileAvatarRepository,
} from "@/modules/profile/repositories/profile-avatar-storage-repository"

export const PUBLIC_CONTRACT = true

export type UploadProfileAvatarInput = Parameters<
  typeof uploadProfileAvatarRepository
>[0]
export type UploadProfileAvatarResult = Awaited<
  ReturnType<typeof uploadProfileAvatarRepository>
>

export function uploadProfileAvatar(
  input: UploadProfileAvatarInput
): ReturnType<typeof uploadProfileAvatarRepository> {
  return uploadProfileAvatarRepository(input)
}
