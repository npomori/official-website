/**
 * CSRF保護ミドルウェア
 * トークンベースのCSRF対策（Nginxプロキシ環境対応）
 */
import type { MiddlewareHandler } from 'astro'
import crypto from 'node:crypto'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = '__csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * CSRFトークンを生成
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * CSRFトークンを比較（タイミング攻撃対策）
 */
function compareTokens(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
  } catch {
    return false
  }
}

/**
 * CSRF保護が必要なパスかチェック
 */
function requiresCsrfProtection(pathname: string): boolean {
  const protectedPaths = ['/api/auth/', '/api/email/', '/api/admin/', '/api/member/']

  return protectedPaths.some((path) => pathname.startsWith(path))
}

/**
 * CSRF保護ミドルウェア
 */
export const csrf: MiddlewareHandler = async (context, next) => {
  const { request, cookies, url } = context
  const method = request.method.toUpperCase()
  const pathname = url.pathname

  // GET, HEAD, OPTIONS は常に許可（トークン生成のみ）
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    let csrfToken = cookies.get(CSRF_COOKIE_NAME)?.value

    if (!csrfToken) {
      csrfToken = generateCsrfToken()
      cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24時間
      })
    }

    context.locals.csrfToken = csrfToken
    return next()
  }

  // POST, PUT, DELETE, PATCH で保護対象パスの場合のみ検証
  if (!requiresCsrfProtection(pathname)) {
    return next()
  }

  const cookieToken = cookies.get(CSRF_COOKIE_NAME)?.value
  const requestToken = request.headers.get(CSRF_HEADER_NAME)

  // トークンの検証
  if (!cookieToken || !requestToken || !compareTokens(cookieToken, requestToken)) {
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const firstIp = xForwardedFor ? xForwardedFor.split(',')[0] : null
    const clientIp = firstIp?.trim() || request.headers.get('x-real-ip') || 'unknown'

    console.warn(`CSRF検証失敗: ${pathname} from ${clientIp}`)

    return new Response(
      JSON.stringify({
        success: false,
        message: '不正なリクエストです。ページを再読み込みしてください。'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  context.locals.csrfToken = cookieToken
  return next()
}

/**
 * CSRFトークン名をエクスポート
 */
export const CSRF_TOKEN_HEADER = CSRF_HEADER_NAME
export const CSRF_TOKEN_COOKIE = CSRF_COOKIE_NAME
