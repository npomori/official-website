import type { MiddlewareHandler } from 'astro'

/**
 * グローバルエラーハンドリングミドルウェア
 * すべてのリクエストを包括的に監視し、予期しないエラーをキャッチします
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  try {
    return await next()
  } catch (error) {
    console.error('[Error Middleware] Unhandled error:', error)

    // 開発環境では詳細なエラーを表示
    if (import.meta.env.DEV) {
      throw error
    }

    // 本番環境では500ページへリダイレクト
    return context.redirect('/500', 302)
  }
}
