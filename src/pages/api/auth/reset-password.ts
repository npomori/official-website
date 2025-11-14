/**
 * パスワードリセット実行 API
 * POST /api/auth/reset-password
 */
import { authRateLimiter } from '@/middleware/rate-limit'
import { UserDB } from '@/server/db'
import { hash } from '@/server/utils/password'
import Session from '@/server/utils/session'
import type { ApiResponse } from '@/types/api'
import type { APIRoute } from 'astro'

export const prerender = false

// レート制限: 5分間に5回まで
export const onRequest = authRateLimiter

/**
 * パスワード強度検証
 */
function validatePasswordStrength(password: string): {
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

interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export const POST: APIRoute = async (context) => {
  const { request } = context
  try {
    const data: ResetPasswordRequest = await request.json()
    const { token, newPassword } = data

    if (!token || !newPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'トークンとパスワードを入力してください'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // パスワード強度検証
    const validation = validatePasswordStrength(newPassword)
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validation.message || 'パスワードの形式が不正です'
        } satisfies ApiResponse<never>),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // トークンでユーザーを検索
    const user = await UserDB.getUserByResetToken(token)

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'リセットリンクが無効または期限切れです'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // パスワードをハッシュ化
    const hashedPassword = await hash(newPassword)

    // パスワード更新とトークン削除
    const isPasswordUpdated = await UserDB.updatePasswordAndClearResetToken(user.id, hashedPassword)

    if (!isPasswordUpdated) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'パスワードの更新に失敗しました'
        } satisfies ApiResponse<never>),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // セキュリティ強化: すべてのセッションを無効化
    // 他のデバイスからのアクセスも強制的にログアウトさせる
    try {
      const deletedCount = await Session.deleteUserSessions(user.id, context)
      console.log(`ユーザー ${user.id} の ${deletedCount} 個のセッションを削除しました`)
    } catch (err) {
      console.error('セッション削除エラー:', err)
      // セッション削除に失敗しても処理は継続
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'パスワードを変更しました。セキュリティのため、すべてのデバイスからログアウトされました。新しいパスワードでログインしてください。'
      } satisfies ApiResponse<never>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('パスワードリセットエラー:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'パスワードリセットに失敗しました'
      } satisfies ApiResponse<never>),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
