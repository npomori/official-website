import config from '@/server/config'
import Auth from '@/server/utils/auth'
import RedisSession from '@/server/utils/redis-session'
import Session from '@/server/utils/session'
import type { UserRole, UserSessionData } from '@/types/user'
import { defineMiddleware } from 'astro/middleware'
import Redis from 'ioredis'

// セッション管理用のRedisクライアント作成
const redis = new Redis(config.SESSION_REDIS_URL)
const redisSession = new RedisSession({ client: redis, ttl: config.SESSION_EXPIRES })

// 保護されたルートへのアクセス制御を行う関数
const isAuthorizedForProtectedRoute = (pathname: string, userRole: UserRole): boolean => {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return true
    }
    if (userRole === 'EDITOR') {
      return config.EDITOR_ENABLED_ROUTES.some((route) => pathname.startsWith(route))
    }
    return false
  }
  return true
}

// 権限エラーレスポンスを生成
const createUnauthorizedResponse = (pathname: string, redirectUrl: URL): Response => {
  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/', redirectUrl).toString(),
      'Content-Type': 'text/html'
    }
  })
}

// 未認証時のレスポンスを生成
const createUnauthenticatedResponse = (pathname: string, url: URL): Response => {
  if (pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return Response.redirect(new URL(`/login?redirect=${pathname}`, url))
}

// ユーザー認証を実行
const authenticateUser = async (
  context: Parameters<Parameters<typeof defineMiddleware>[0]>[0]
): Promise<UserSessionData | null> => {
  // セッションからユーザー取得
  let user = await Session.getUser(context)

  // セッションがない場合はRemember Meから取得
  if (!user) {
    user = await Auth.getRememberMeUser(context)
  }

  return user
}

export const auth = defineMiddleware(async (context, next) => {
  // Redisセッション管理用APIを設定
  context.locals.session = redisSession

  // ユーザー認証
  const user = await authenticateUser(context)
  const { pathname } = context.url

  if (user) {
    context.locals.user = user

    // 権限チェック
    if (!isAuthorizedForProtectedRoute(pathname, user.role)) {
      return createUnauthorizedResponse(pathname, context.url)
    }

    return next()
  }

  // 未認証時: 保護ルートかチェック
  const isProtected = config.PROTECTED_ROUTES.some((path) => pathname.startsWith(path))
  if (isProtected) {
    return createUnauthenticatedResponse(pathname, context.url)
  }

  return next()
})
