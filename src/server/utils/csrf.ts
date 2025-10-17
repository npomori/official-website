/**
 * CSRF対策ユーティリティ
 */

/**
 * リクエストのOriginヘッダーを検証
 * 同一オリジンからのリクエストかどうかをチェック
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // OriginまたはRefererヘッダーが存在しない場合は拒否
  if (!origin && !referer) {
    return false
  }

  // 許可されたオリジンのリスト
  const allowedOrigins = [
    new URL(request.url).origin // 同一オリジン
    // 本番環境では環境変数から取得することを推奨
    // process.env.PUBLIC_URL,
  ]

  // Originヘッダーのチェック
  if (origin) {
    return allowedOrigins.includes(origin)
  }

  // Refererヘッダーのチェック（Originがない場合）
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      return allowedOrigins.includes(refererOrigin)
    } catch {
      return false
    }
  }

  return false
}

/**
 * POSTリクエストのCSRF検証
 */
export function validateCsrfForPost(request: Request): boolean {
  // GETリクエストはCSRF対策不要
  if (request.method === 'GET') {
    return true
  }

  // POST、PUT、DELETEなどのリクエストはOrigin検証
  return validateOrigin(request)
}
