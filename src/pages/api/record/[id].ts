import { RecordDB } from '@/server/db'
import type { Record } from '@/types/record'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const recordId = parseInt(params.id!)

    if (isNaN(recordId)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無効な記録IDです'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザーのログイン状態を取得
    const user = locals.user
    const isLoggedIn = !!user

    // RecordDBを使用して記録を取得
    const record =
      isLoggedIn && (user.role === 'ADMIN' || user.role === 'MODERATOR' || user.role === 'EDITOR')
        ? await RecordDB.getRecordById(recordId)
        : await RecordDB.getPublicRecordById(recordId)

    if (!record) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '活動記録が見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 非公開の記録は管理者のみアクセス可能（getRecordByIdを使用した場合のみチェック）
    if (record.status !== 'published' && !isLoggedIn) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'この活動記録にアクセスする権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: record
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Record GET API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動記録の取得に失敗しました'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
