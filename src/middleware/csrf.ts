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
    console.warn('[CSRF] トークン長不一致:', {
      cookieLength: a.length,
      requestLength: b.length
    })
    return false
  }

  try {
    const result = crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
    if (!result) {
      console.warn('[CSRF] トークン値不一致:', {
        cookie: a.substring(0, 8) + '...',
        request: b.substring(0, 8) + '...'
      })
    }
    return result
  } catch (error) {
    console.error('[CSRF] トークン比較エラー:', error)
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

  console.log('[CSRF] リクエスト:', { method, pathname, isDev: import.meta.env.DEV })

  // 開発環境ではCSRF検証をスキップ
  if (import.meta.env.DEV) {
    const csrfToken = generateCsrfToken()
    context.locals.csrfToken = csrfToken
    return next()
  }

  // GET, HEAD, OPTIONS は常に許可（トークン生成のみ）
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    let csrfToken = cookies.get(CSRF_COOKIE_NAME)?.value

    if (!csrfToken) {
      csrfToken = generateCsrfToken()
      cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // JavaScriptからアクセス可能にする
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24時間
      })
      console.log('[CSRF] 新規トークン発行:', {
        token: csrfToken.substring(0, 8) + '...',
        secure: import.meta.env.PROD,
        sameSite: 'lax'
      })
    } else {
      console.log('[CSRF] 既存トークン使用:', csrfToken.substring(0, 8) + '...')
    }

    context.locals.csrfToken = csrfToken
    return next()
  }

  // POST, PUT, DELETE, PATCH で保護対象パスの場合のみ検証
  if (!requiresCsrfProtection(pathname)) {
    console.log('[CSRF] 保護対象外パス:', pathname)
    return next()
  }

  const cookieToken = cookies.get(CSRF_COOKIE_NAME)?.value
  const requestToken = request.headers.get(CSRF_HEADER_NAME)
  const allCookies = request.headers.get('cookie')

  console.log('[CSRF] 検証開始:', {
    pathname,
    hasCookieToken: !!cookieToken,
    hasRequestToken: !!requestToken,
    cookieTokenPreview: cookieToken?.substring(0, 8) + '...',
    requestTokenPreview: requestToken?.substring(0, 8) + '...',
    allCookies: allCookies?.split(';').map((c) => c.trim().split('=')[0]),
    requestHeaders: {
      'x-csrf-token': request.headers.get('x-csrf-token'),
      cookie: allCookies?.length || 0,
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'user-agent': request.headers.get('user-agent')?.substring(0, 50)
    }
  })

  // トークンの検証
  if (!cookieToken || !requestToken || !compareTokens(cookieToken, requestToken)) {
    const xForwardedFor = request.headers.get('x-forwarded-for')
    const firstIp = xForwardedFor ? xForwardedFor.split(',')[0] : null
    const clientIp = firstIp?.trim() || request.headers.get('x-real-ip') || 'unknown'

    console.error('[CSRF] 検証失敗:', {
      pathname,
      clientIp,
      reason: !cookieToken ? 'Cookie未送信' : !requestToken ? 'ヘッダー未送信' : 'トークン不一致',
      cookieToken: cookieToken?.substring(0, 16) || 'なし',
      requestToken: requestToken?.substring(0, 16) || 'なし'
    })

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

  console.log('[CSRF] 検証成功:', pathname)
  context.locals.csrfToken = cookieToken
  return next()
}

/**
 * CSRFトークン名をエクスポート
 */
export const CSRF_TOKEN_HEADER = CSRF_HEADER_NAME
export const CSRF_TOKEN_COOKIE = CSRF_COOKIE_NAME
