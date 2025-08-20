import { EventDB } from '@/server/db'
import type { EventAdminRequest } from '@/types/event'
import type { APIRoute } from 'astro'

// Event API
export const GET: APIRoute = async () => {
  try {
    const events = await EventDB.getEvents()

    return new Response(
      JSON.stringify({
        success: true,
        data: events
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // リクエストパラメータ:
    // - title: イベントのタイトル (string)
    // - start: イベントの開始日時 (string, フォーマット「YYYY-MM-DDThh:mm」)
    // - end: イベントの終了日時 (string, フォーマット「YYYY-MM-DDThh:mm」)
    // - allDay: 終日イベントかどうかを示すフラグ (boolean)

    const body = await request.json()

    // リクエストボディの型チェック
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '不正なリクエストです'
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { title, start, end, allDay, category, description, url } = body as EventAdminRequest

    // 必須フィールドのチェック
    if (
      typeof title !== 'string' ||
      typeof start !== 'string' ||
      typeof end !== 'string' ||
      typeof allDay !== 'boolean' ||
      typeof category !== 'string' ||
      typeof description !== 'string' ||
      typeof url !== 'string'
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '必須フィールドが不足しています'
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    let errMessage = ''
    let startDate, endDate

    // JSTからUTCに変換してDateオブジェクトを生成
    if (allDay) {
      // 終日イベントの場合は日付部分のみを使用
      startDate = new Date(start + 'T00:00:00+09:00')
      endDate = new Date(end + 'T00:00:00+09:00')
    } else {
      // 通常のイベントの場合は時間部分も含めて生成
      startDate = new Date(start + '+0900')
      endDate = new Date(end + '+0900')
    }

    // 日付形式のチェック
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '日付の形式が不正です'
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 開始日時の範囲チェック（1か月前から1年後まで）
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    if (startDate < oneMonthAgo || startDate > oneYearLater) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'イベントの開始日時は1か月前から1年後までの範囲で設定してください'
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 開始日時<終了日時のチェック
    // 通常イベントの場合は開始日時、終了日時が同じ場合を登録可能とする(開始日時終了日時が同じで、開始時間のみのパターン)
    if ((allDay && startDate >= endDate) || (!allDay && startDate > endDate)) {
      if (allDay) {
        errMessage = '開始日は終了日より前でなければなりません'
      } else {
        errMessage = '開始時間は終了時間より前でなければなりません'
      }
      return new Response(
        JSON.stringify({
          success: false,
          message: errMessage
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (title.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'データ登録に失敗しました'
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const event = await EventDB.addEvent({
      title: title,
      start: startDate,
      end: endDate,
      isAllDay: allDay,
      categoryId: category,
      description: description,
      url: url,
      creatorId: locals.user.id
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: event
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
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
