import { UserDB } from '@/server/db'
import { sendUserVerificationEmail } from '@/server/utils/email'
import { hash } from '@/server/utils/password'
import type { APIRoute } from 'astro'
import { randomBytes } from 'node:crypto'

// Event API
export const GET: APIRoute = async () => {
  try {
    const users = await UserDB.getUsers()

    return new Response(
      JSON.stringify({
        success: true,
        data: users
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { email, name, role, password, requireEmailVerification } = body

    if (!name || !email || !role) {
      const errMessage = '必要な情報が不足しています'
      return new Response(
        JSON.stringify({
          success: false,
          message: errMessage
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 直接パスワード設定の場合はパスワード必須
    if (!requireEmailVerification && !password) {
      const errMessage = 'パスワードは必須です'
      return new Response(
        JSON.stringify({
          success: false,
          message: errMessage
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 名前の重複チェック
    const existingName = await UserDB.getUserByName(name as string)
    if (existingName) {
      const errMessage = 'この名前は既に使用されています'
      return new Response(
        JSON.stringify({
          success: false,
          message: errMessage
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // メールアドレスの重複チェック
    const existingUser = await UserDB.getUserByEmail(email as string)
    if (existingUser) {
      const errMessage = 'このメールアドレスは既に使用されています'
      return new Response(
        JSON.stringify({
          success: false,
          message: errMessage
        }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    let hashedPassword: string
    let verificationToken: string | undefined
    let verificationExpires: Date | undefined

    if (requireEmailVerification) {
      // メール認証方式: 仮パスワードとトークンを生成
      const tempPassword = randomBytes(32).toString('hex')
      hashedPassword = await hash(tempPassword)
      verificationToken = randomBytes(32).toString('hex')
      verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    } else {
      // 直接設定方式: 提供されたパスワードをハッシュ化
      hashedPassword = await hash(password as string)
    }

    const user = await UserDB.addUser(locals.user!.id, {
      email: email as string,
      name: name as string,
      password: hashedPassword,
      role: role as string
    })

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'データ登録に失敗しました'
        }),
        {
          status: 400,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // メール認証方式の場合
    if (requireEmailVerification && verificationToken && verificationExpires) {
      // 認証トークンを設定し、isEnabled を false に
      await UserDB.setVerificationToken(user.id, verificationToken, verificationExpires)
      await UserDB.updateUser(locals.user!.id, user.id, {
        name: user.name,
        email: user.email,
        role: user.role,
        isEnabled: false
      })

      // 認証メールを送信
      try {
        await sendUserVerificationEmail({
          name: user.name,
          email: user.email,
          verificationToken,
          expiresInHours: 24
        })
      } catch (mailError) {
        console.error('メール送信エラー:', mailError)
        // メール送信失敗してもユーザは作成されているので、成功レスポンスを返す
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: user,
          message: 'ユーザを追加しました。認証メールを送信しました。'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 直接設定方式の場合
    return new Response(
      JSON.stringify({
        success: true,
        data: user,
        message: 'ユーザを追加しました。'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
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
