import { UserDB } from '@/server/db'
import Auth from '@/server/utils/auth'
import { verify } from '@/server/utils/password'
import Session from '@/server/utils/session'
import type { UserSessionData } from '@/types/user'
import { convertToUserSessionData } from '@/types/user'
import type { APIRoute } from 'astro'

export const POST: APIRoute = async (context) => {
  const { request } = context

  // ヘッダチェック
  if (request.headers.get('Content-Type') !== 'application/json') {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'リクエストのフォーマットが不正です'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    const body = await request.json()
    const email = body.email
    const password = body.password
    const rememberMe = body.rememberMe

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Eメールとパスワードが必要です'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザ情報取得
    const userWithPassword = await UserDB.getUserByEmail(email)
    if (!userWithPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Eメールまたはパスワードが不正です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザが無効化されている場合はログインを拒否
    if (!userWithPassword.isEnabled) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'このアカウントは無効化されています'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザ認証
    const verified = await verify(password, userWithPassword.password)
    if (!verified) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Eメールまたはパスワードが不正です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 最終ログイン日時を更新
    await UserDB.updateLastLoginAt(userWithPassword.id)

    // セッション(ユーザ情報)作成
    const sessionData: UserSessionData = convertToUserSessionData(userWithPassword)
    await Session.createUser(context, sessionData)

    if (rememberMe) {
      // remember me トークン作成
      await Auth.createRememberMe(context, userWithPassword.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ログインしました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (err) {
    console.error(err)

    return new Response(
      JSON.stringify({
        success: false,
        message: 'ログインに失敗しました'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
