type ValidateAdultSignUpParams = {
  birthDate: string
}

export function validateAdultSignUp(params: ValidateAdultSignUpParams) {
  const { birthDate } = params

  if (!birthDate) {
    throw new Error("생년월일이 필요합니다")
  }

  const today = new Date()
  const birth = new Date(birthDate)

  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  if (age < 19) {
    throw new Error("만 19세 이상만 가입할 수 있습니다")
  }

  return {
    isAdult: true,
  }
}