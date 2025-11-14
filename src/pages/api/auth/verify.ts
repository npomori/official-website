/**
 * ユーザ認証実行 API
 * POST /api/auth/verify
 */
import { authRateLimiter } from '@/middleware/rate-limit'
import { UserDB } from '@/server/db'
import { hash, validatePasswordStrength } from '@/server/utils/password'
import type { ApiResponse } from '@/types/api'
import type { APIRoute } from 'astro'

export const prerender = false

// レート制限: 5分間に5回まで
export const onRequest = authRateLimiter

interface VerifyRequest {
  token: string
  password: string
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: VerifyRequest = await request.json()
    const { token, password } = data

    if (!token || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'トークンとパスワードを入力してください'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // パスワードの強度チェック
    const validation = validatePasswordStrength(password)
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
    const user = await UserDB.getUserByVerificationToken(token)

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '認証リンクが無効です'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // トークンの有効期限チェック
    if (!user.verificationExpires || user.verificationExpires < new Date()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '認証リンクの有効期限が切れています'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // パスワードをハッシュ化
    const hashedPassword = await hash(password)

    // パスワード設定とユーザ有効化
    const isActivated = await UserDB.activateUserWithPassword(user.id, hashedPassword)

    if (!isActivated) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ユーザの有効化に失敗しました'
        } satisfies ApiResponse<never>),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ユーザ認証が完了しました。ログインしてください。'
      } satisfies ApiResponse<never>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('ユーザ認証エラー:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'ユーザ認証に失敗しました'
      } satisfies ApiResponse<never>),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
