/**
 * パスワードリセットトークン検証 API
 * GET /api/auth/verify-reset-token?token=xxx
 */
import { UserDB } from '@/server/db'
import type { ApiResponse } from '@/types/api'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  try {
    const token = url.searchParams.get('token')

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          data: { valid: false },
          message: 'トークンが指定されていません'
        } satisfies ApiResponse<{ valid: boolean }>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // トークンでユーザーを検索
    const user = await UserDB.getUserByResetToken(token)

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          data: { valid: false },
          message: 'リセットリンクが無効または期限切れです'
        } satisfies ApiResponse<{ valid: boolean }>),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { valid: true },
        message: 'トークンは有効です'
      } satisfies ApiResponse<{ valid: boolean }>),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('トークン検証エラー:', error)
    return new Response(
      JSON.stringify({
        success: false,
        data: { valid: false },
        message: 'トークン検証に失敗しました'
      } satisfies ApiResponse<{ valid: boolean }>),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
