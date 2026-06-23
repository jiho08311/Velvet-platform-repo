export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function validateUsername(value: string) {
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