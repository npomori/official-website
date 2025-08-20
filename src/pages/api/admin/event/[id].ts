import { EventDB } from '@/server/db'
import { formatDate } from '@/server/utils/date'
import type { EventAdminRequest, EventAdminResponse } from '@/types/event'
import type { APIRoute } from 'astro'

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '有効なIDが指定されていません'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const result = await EventDB.deleteEvent(id)

    return new Response(
      JSON.stringify({
        success: true,
        data: { message: 'データを削除しました' }
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

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // リクエストパラメータ:
    // - title: イベントのタイトル (string)
    // - start: イベントの開始日時 (string, フォーマット「YYYY-MM-DDThh:mm」)
    // - end: イベントの終了日時 (string, フォーマット「YYYY-MM-DDThh:mm」)
    // - allDay: 終日イベントかどうかを示すフラグ (boolean)
    let errMessage = ''
    let startDate, endDate
    //const { id } = params

    const id = Number(params.id)
    if (isNaN(id)) {
      return new Response(JSON.stringify({ message: '有効なIDが指定されていません' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

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

    const event = await EventDB.updateEvent(Number(id), {
      title: title,
      start: startDate,
      end: endDate,
      isAllDay: allDay,
      categoryId: category,
      description: description,
      url: url
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

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)
    if (isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '有効なIDが指定されていません'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const event = await EventDB.getEventById(id)

    if (!event) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'イベントが見つかりませんでした'
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const mappedEvent: EventAdminResponse = {
      id: event.id,
      title: event.title,
      allDay: event.isAllDay,
      start: formatDate(event.start, event.isAllDay),
      end: formatDate(event.end, event.isAllDay),
      category: event.categoryId,
      description: event.description ?? '',
      url: event.url ?? ''
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedEvent
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
