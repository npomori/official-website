/**
 * パスワードリセット実行 API
 * POST /api/auth/reset-password
 */
import { UserDB } from '@/server/db'
import { hash } from '@/server/utils/password'
import type { ApiResponse } from '@/types/api'
import type { APIRoute } from 'astro'

interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export const POST: APIRoute = async ({ request }) => {
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

    // パスワードの強度チェック
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'パスワードは8文字以上で入力してください'
        } satisfies ApiResponse<never>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
    await UserDB.updatePasswordAndClearResetToken(user.id, hashedPassword)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'パスワードを変更しました。新しいパスワードでログインしてください。'
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
