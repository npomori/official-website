/**
 * パスワードリセット申請 API
 * POST /api/auth/forgot-password
 */
import { UserDB } from '@/server/db'
import { sendPasswordResetEmail } from '@/server/utils/email'
import type { ApiResponse } from '@/types/api'
import type { APIRoute } from 'astro'
import crypto from 'node:crypto'

interface ForgotPasswordRequest {
  email: string
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: ForgotPasswordRequest = await request.json()
    const { email } = data

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'メールアドレスを入力してください'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '有効なメールアドレスを入力してください'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ユーザーを検索（セキュリティのため、存在しなくても同じレスポンスを返す）
    const user = await UserDB.getUserByEmail(email)

    // ユーザーが存在し、有効な場合のみメール送信
    if (user && user.isEnabled) {
      // トークン生成（暗号学的に安全な乱数）
      const resetToken = crypto.randomBytes(32).toString('hex')

      // 有効期限: 60分後
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // DBに保存
      await UserDB.setPasswordResetToken(user.id, resetToken, expiresAt)

      // メール送信
      await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetToken,
        expiresInMinutes: 60
      })
    }

    // セキュリティのため、ユーザーが存在しない場合も同じレスポンスを返す
    return new Response(
      JSON.stringify({
        success: true,
        message: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
      } satisfies ApiResponse<never>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('パスワードリセット申請エラー:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'パスワードリセット申請に失敗しました'
      } satisfies ApiResponse<never>),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
