import type { ApiResponse, ValidationErrorResponse } from '@/types/api'
import { getErrorMessage } from '@/types/api'

export abstract class BaseApiFetch {
  protected async request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, options)
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
        data: data.data || data
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
