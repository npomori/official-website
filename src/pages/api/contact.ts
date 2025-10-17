import { ContactFormSchema } from '@/schemas/contact'
import { validateCsrfForPost } from '@/server/utils/csrf'
import { sendContactEmail } from '@/server/utils/email'
import type { ApiResponse, ValidationErrorResponse } from '@/types/api'
import type { APIRoute } from 'astro'

/**
 * お問い合わせAPI
 * POST /api/contact
 */
export const POST: APIRoute = async (context) => {
  const { request } = context

  // CSRF対策: Origin/Refererヘッダーの検証
  if (!validateCsrfForPost(request)) {
    const response: ApiResponse<null> = {
      success: false,
      message: '不正なリクエストです'
    }
    return new Response(JSON.stringify(response), {
      status: 403,
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
    const validationResult = ContactFormSchema.safeParse(body)

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

    const { name, email, memberType, subject, message } = validationResult.data

    // メール送信
    try {
      await sendContactEmail({
        name,
        email,
        memberType,
        subject,
        message
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
      message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
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
    console.error('お問い合わせAPI エラー:', error)
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
