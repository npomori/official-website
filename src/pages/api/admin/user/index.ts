import { UserDB } from '@/server/db'
import { hash } from '@/server/utils/password'
import type { UserAdminRequest } from '@/types/user'
import type { APIRoute } from 'astro'

// Event API
export const GET: APIRoute = async () => {
  const users = await UserDB.getUsers()

  return new Response(JSON.stringify(users), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { email, name, password, role } = body as UserAdminRequest

    if (!name || !email || !password || !role) {
      const errMessage = '必要な情報が不足しています'
      return new Response(JSON.stringify({ message: errMessage }), {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // 名前の重複チェック
    const existingName = await UserDB.getUserByName(name)
    if (existingName) {
      const errMessage = 'この名前は既に使用されています'
      return new Response(JSON.stringify({ message: errMessage }), {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // メールアドレスの重複チェック
    const existingUser = await await UserDB.getUserByEmail(email)
    if (existingUser) {
      const errMessage = 'このメールアドレスは既に使用されています'
      return new Response(JSON.stringify({ message: errMessage }), {
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // パスワードのハッシュ化
    const hashedPassword = await hash(password)

    const user = await UserDB.addUser(locals.user.id, {
      email: email,
      name: name,
      password: hashedPassword,
      role: role
    })
    if (!user) {
      return new Response(JSON.stringify({ message: 'データ登録に失敗しました' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
