/**
 * レート制限ミドルウェア
 * Redisを使用してリクエスト数を追跡
 */
import { getRedisClient } from '@/server/utils/redis'
import type { MiddlewareHandler } from 'astro'

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyGenerator?: (context: Parameters<MiddlewareHandler>[0]) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

/**
 * IPアドレスを取得
 * Nginxプロキシ背後を考慨してX-Forwarded-Forヘッダーを優先
 */
function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    // 複数のIPがある場合は最初のものを使用
    const firstIp = xForwardedFor.split(',')[0]
    return firstIp ? firstIp.trim() : 'unknown'
  }

  const xRealIp = request.headers.get('X-Real-IP')
  if (xRealIp) {
    return xRealIp
  }

  return 'unknown'
}

/**
 * レート制限ミドルウェアを生成
 */
export function createRateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const { maxRequests, windowMs, keyGenerator, skipSuccessfulRequests, skipFailedRequests } =
    options

  return async (context, next) => {
    const redis = getRedisClient()

    // デフォルトのキー生成: IP アドレスベース
    const clientIp = getClientIp(context.request)
    const baseKey = keyGenerator ? keyGenerator(context) : `ratelimit:${clientIp}`
    const key = `${baseKey}:${context.url.pathname}`

    try {
      // 現在のカウントを取得してインクリメント
      const current = await redis.incr(key)

      if (current === 1) {
        // 初回アクセス時に有効期限を設定
        await redis.pexpire(key, windowMs)
      }

      // レート制限を超えた場合
      if (current > maxRequests) {
        const ttl = await redis.pttl(key)
        const retryAfter = Math.ceil(ttl / 1000)

        return new Response(
          JSON.stringify({
            success: false,
            message: 'リクエストが多すぎます。しばらくしてから再試行してください。',
            retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.floor((Date.now() + ttl) / 1000))
            }
          }
        )
      }

      // リクエストを実行
      const response = await next()

      // レスポンスのステータスに応じてカウントを調整
      if (skipSuccessfulRequests && response.status < 400) {
        await redis.decr(key)
      } else if (skipFailedRequests && response.status >= 400) {
        await redis.decr(key)
      }

      // レート制限ヘッダーを追加
      response.headers.set('X-RateLimit-Limit', String(maxRequests))
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - current)))

      const ttl = await redis.pttl(key)
      if (ttl > 0) {
        response.headers.set('X-RateLimit-Reset', String(Math.floor((Date.now() + ttl) / 1000)))
      }

      return response
    } catch (error) {
      console.error('レート制限エラー:', error)
      // Redisエラー時はレート制限をスキップしてリクエストを通す
      return next()
    }
  }
}

/**
 * 認証API用のレート制限（厳格）
 * IP単位で5分間に5回まで
 */
export const authRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

/**
 * パスワードリセット用のレート制限
 * IP単位で1時間に3回まで
 */
export const passwordResetRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
})

/**
 * メール送信用のレート制限（メールアドレス単位）
 * 同一メールアドレスへの送信を15分間に1回まで
 */
export function createEmailRateLimiter(maxRequests = 1, windowMs = 15 * 60 * 1000) {
  return createRateLimiter({
    maxRequests,
    windowMs,
    keyGenerator: (context) => {
      // リクエストボディからメールアドレスを取得する必要がある場合は
      // 各APIで個別に実装する
      const clientIp = getClientIp(context.request)
      return `email:${clientIp}`
    }
  })
}

/**
 * 一般API用のレート制限
 * IP単位で1分間に30回まで
 */
export const generalRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000
})

/**
 * お問い合わせフォーム用のレート制限
 * IP単位で1時間に5回まで
 */
export const contactRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 60 * 1000
})

/**
 * 入会申し込み用のレート制限
 * IP単位で1日に3回まで
 */
export const joinRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 24 * 60 * 60 * 1000
})

/**
 * トークン検証用のレート制限
 * IP単位で1分間に10回まで（通常使用では十分、列挙攻撃を防ぐ）
 */
export const tokenVerificationRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000
})
