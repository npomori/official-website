// 共通のAPIレスポンス型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: { [key: string]: string }
}

// サーバー側バリデーションエラーの型定義
export interface ValidationErrorResponse {
  message?: string
  errors?: { [key: string]: string }
}

// HTTPステータスコードに応じたエラーメッセージ
export const getErrorMessage = (status: number, message?: string): string => {
  switch (status) {
    case 400:
      return message || 'リクエストが不正です'
    case 401:
      return '認証が必要です'
    case 403:
      return 'アクセス権限がありません'
    case 404:
      return 'リソースが見つかりません'
    case 422:
      return message || '入力内容に問題があります'
    case 500:
      return 'サーバーエラーが発生しました。しばらく時間をおいて再度お試しください'
    default:
      return message || 'エラーが発生しました'
  }
}
