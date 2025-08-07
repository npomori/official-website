import config from '@/server/config'
import Auth from '@/server/utils/auth'
import RedisSession from '@/server/utils/redis-session'
import Session from '@/server/utils/session'
import { defineMiddleware } from 'astro/middleware'
import Redis from 'ioredis'

// セッション管理用のRedisクライアント作成
const redis = new Redis(config.SESSION_REDIS_URL)
const redisSession = new RedisSession({ client: redis, ttl: config.SESSION_EXPIRES })

// 保護されたルートへのアクセス制御を行う関数
const isAuthorizedForProtectedRoute = (pathname: string, userRole: string): boolean => {
  // admin関連のパスに対する権限チェック
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return true
    } else if (userRole === 'EDITOR') {
      // EDITORロールがアクセスできるURLをチェック
      return config.EDITOR_ENABLED_ROUTES.some((route) => pathname.startsWith(route))
    } else {
      return false
    }
  }
  return true
}

export const auth = defineMiddleware(async (context, next) => {
  // Redisセッション管理用APIを取得
  context.locals.session = redisSession

  // セッションからユーザ情報取得
  const user = await Session.getUser(context)
  if (user) {
    context.locals.user = user

    // 保護されたルートへのアクセス権限チェック
    if (!isAuthorizedForProtectedRoute(context.url.pathname, user.role)) {
      if (context.url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      } else {
        // 通常のページアクセスの場合はホームにリダイレクト
        return new Response(null, {
          status: 302,
          headers: {
            Location: new URL('/', context.url).toString(),
            'Content-Type': 'text/html'
          }
        })
      }
    }

    return next()
  } else {
    // セッションがない場合は「remember me」からユーザ情報取得
    const user = await Auth.getRememberMeUser(context)
    if (user) {
      context.locals.user = user

      // 保護されたルートへのアクセス権限チェック
      if (!isAuthorizedForProtectedRoute(context.url.pathname, user.role)) {
        if (context.url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          })
        } else {
          // 通常のページアクセスの場合はホームにリダイレクト
          return new Response(null, {
            status: 302,
            headers: {
              Location: new URL('/', context.url).toString(),
              'Content-Type': 'text/html'
            }
          })
        }
      }

      return next()
    } else {
      const result = config.PROTECTED_ROUTES.some((path) => context.url.pathname.startsWith(path))
      if (result) {
        // 管理画面と管理用APIはアクセス不可
        if (context.url.pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          })
        } else {
          // 通常のページアクセスの場合はログインページにリダイレクト
          return Response.redirect(new URL(`/login?redirect=${context.url.pathname}`, context.url))
        }
      } else {
        return next()
      }
    }
  }
})
