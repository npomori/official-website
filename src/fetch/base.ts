import type { ApiResponse, ValidationErrorResponse } from '@/types/api'
import { getErrorMessage } from '@/types/api'

/**
 * Cookie から CSRF トークンを取得
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  console.log('[BaseApiFetch] 全Cookie:', cookies)
  console.log('[BaseApiFetch] Cookie文字列:', document.cookie)
  console.log('[BaseApiFetch] プロトコル:', window.location.protocol)
  console.log('[BaseApiFetch] ホスト:', window.location.host)

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    console.log('[BaseApiFetch] Cookie解析:', { name, value: value?.substring(0, 8) })

    if (name === '__csrf_token') {
      const token = decodeURIComponent(value)
      console.log('[BaseApiFetch] CSRFトークン取得成功:', token.substring(0, 8) + '...')
      return token
    }
  }

  console.error(
    '[BaseApiFetch] CSRFトークンが見つかりません - ブラウザのApplicationタブでCookieを確認してください'
  )
  return null
}

export abstract class BaseApiFetch {
  protected async request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const headers = new Headers(options?.headers)
      const method = options?.method?.toUpperCase() || 'GET'

      // POST, PUT, DELETE, PATCH の場合のみCSRFトークンを追加
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        const csrfToken = getCsrfToken()
        console.log('[BaseApiFetch] CSRFトークン送信:', {
          method,
          url,
          hasToken: !!csrfToken,
          tokenPreview: csrfToken?.substring(0, 8) + '...'
        })

        if (csrfToken) {
          headers.set('x-csrf-token', csrfToken)
        } else {
          console.error('[BaseApiFetch] CSRFトークンが取得できません！')
        }
      }

      const response = await fetch(url, {
        ...options,
        headers
      })
      const data = await response.json()

      if (!response.ok) {
        // 422エラーの場合、バリデーションエラーとして処理
        if (response.status === 422) {
          const validationData = data as ValidationErrorResponse
          return {
            success: false,
            message: validationData.message || getErrorMessage(response.status),
            ...(validationData.errors && { errors: validationData.errors })
          }
        }

        // その他のエラー
        return {
          success: false,
          message: data.message || getErrorMessage(response.status, data.message)
        }
      }

      return {
        success: true,
        //data: data.data || data
        data: data.data
      }
    } catch (error) {
      console.error('Fetch error:', error)
      return {
        success: false,
        message: 'ネットワークエラーが発生しました'
      }
    }
  }

  protected async requestWithFormData<T>(
    url: string,
    formData: FormData,
    method: string = 'POST'
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method,
      body: formData
    })
  }

  protected async requestWithJson<T>(
    url: string,
    data: any,
    method: string = 'POST'
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  }
}
