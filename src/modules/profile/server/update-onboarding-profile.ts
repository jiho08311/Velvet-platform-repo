// src/modules/profile/server/update-onboarding-profile.ts
import { supabaseAdmin } from "@/infrastructure/supabase/admin"

type UpdateOnboardingProfileParams = {
  profileId: string
  username: string
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

function validateUsername(value: string) {
  if (!value) {
    throw new Error("username을 입력해주세요.")
  }

  if (value.length < 3 || value.length > 20) {
    throw new Error("username은 3자 이상 20자 이하여야 합니다.")
  }

  if (!/^[a-z0-9._]+$/.test(value)) {
    throw new Error("username은 소문자, 숫자, ., _ 만 사용할 수 있습니다.")
  }
}

export async function updateOnboardingProfile({
  profileId,
  username,
}: UpdateOnboardingProfileParams) {
  const normalizedUsername = normalizeUsername(username)

  validateUsername(normalizedUsername)

  const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle()

  if (existingProfileError) {
    throw existingProfileError
  }

  if (!existingProfile) {
    throw new Error("프로필을 찾을 수 없습니다.")
  }

  const { data: duplicatedUsername, error: duplicatedUsernameError } =
    await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", normalizedUsername)
      .neq("id", profileId)
      .maybeSingle()

  if (duplicatedUsernameError) {
    throw duplicatedUsernameError
  }

  if (duplicatedUsername) {
    throw new Error("이미 사용 중인 username입니다.")
  }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      username: normalizedUsername,
    })
    .eq("id", profileId)

  if (updateError) {
    throw updateError
  }

  return {
    success: true,
  }
}