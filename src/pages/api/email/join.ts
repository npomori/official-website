import config from '@/config/config.json'
import { JoinFormSchema } from '@/schemas/join'
import { sendJoinEmail } from '@/server/utils/email'
import type { ApiResponse, ValidationErrorResponse } from '@/types/api'
import type { APIRoute } from 'astro'

/**
 * 入会申し込みAPI
 * POST /api/email/join
 */
export const POST: APIRoute = async (context) => {
  const { request } = context

  // 入会機能が無効の場合（必要に応じて設定を追加）
  if (!config.site.contact.enabled) {
    // 入会機能も contact 設定を流用
    const response: ApiResponse<null> = {
      success: false,
      message: '現在、入会申し込み機能は利用できません'
    }
    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Content-Typeチェック
  if (request.headers.get('Content-Type') !== 'application/json') {
    const response: ApiResponse<null> = {
      success: false,
      message: 'リクエストのフォーマットが不正です'
    }
    return new Response(JSON.stringify(response), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  try {
    // リクエストボディのパース
    const body = await request.json()

    // バリデーション
    const validationResult = JoinFormSchema.safeParse(body)

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        errors[path] = issue.message
      })

      const response: ValidationErrorResponse = {
        message: '入力内容に誤りがあります',
        errors
      }

      return new Response(JSON.stringify(response), {
        status: 422,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const {
      memberType,
      name,
      furigana,
      email,
      tel,
      address,
      birthDate,
      occupation,
      experience,
      motivation
    } = validationResult.data

    // メール送信
    try {
      await sendJoinEmail({
        memberType,
        name,
        furigana,
        email,
        tel,
        address,
        birthDate,
        occupation: occupation || '',
        experience: experience || '',
        motivation
      })
    } catch (error) {
      console.error('メール送信エラー:', error)
      const response: ApiResponse<null> = {
        success: false,
        message: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください。'
      }
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // 成功レスポンス
    const response: ApiResponse<{ message: string }> = {
      success: true,
      message: '入会申し込みを受け付けました。後日、必要書類を郵送いたします。',
      data: {
        message: 'メールを送信しました'
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('入会申し込みAPI エラー:', error)
    const response: ApiResponse<null> = {
      success: false,
      message: 'サーバーエラーが発生しました'
    }
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
