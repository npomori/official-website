import bcrypt from 'bcrypt'

export async function hash(plainPassword: string) {
  return bcrypt.hash(plainPassword, 10)
}

export async function verify(plainPassword: string, hash: string) {
  return bcrypt.compare(plainPassword, hash)
}

/**
 * パスワード強度検証
 * @param password 検証するパスワード
 * @returns 検証結果
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 8) {
    return { valid: false, message: 'パスワードは8文字以上である必要があります' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'パスワードには大文字を含める必要があります' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'パスワードには小文字を含める必要があります' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'パスワードには数字を含める必要があります' }
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, message: 'パスワードには記号を含める必要があります' }
  }

  return { valid: true }
}
