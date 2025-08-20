import { UserDB } from '@/server/db'
import { hash } from '@/server/utils/password'
import type { APIRoute } from 'astro'

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = Number(params.id)

    // 自分のデータは削除不可
    const user = locals.user
    if (user && user.id === id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '自分自身は削除できません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const result = await UserDB.deleteUser(locals.user.id, id)
    if (result) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { message: 'データを削除しました' }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'データを削除できませんでした'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
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

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = Number(params.id)
    const body = await request.json()

    // 自分自身を無効にすることは不可
    const localUser = locals.user
    if (localUser && localUser.id === id && !body.isEnabled) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '自分自身は無効にできません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 必須フィールドのバリデーション
    if (!body.name || !body.email || !body.role) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '必須項目が入力されていません'
        }),
        {
          status: 422,
          statusText: 'Bad Request',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // メールアドレスの重複チェック
    const existingUserByEmail = await UserDB.getUserByEmail(body.email)
    if (existingUserByEmail && existingUserByEmail.id !== id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'このメールアドレスは既に使用されています'
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 名前の重複チェック
    const existingUserByName = await UserDB.getUserByName(body.name)
    if (existingUserByName && existingUserByName.id !== id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'この名前は既に使用されています'
        }),
        {
          status: 422,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // パスワードが指定されている場合は更新
    if (body.password) {
      const hashedPassword = await hash(body.password)
      const passwordUpdated = await UserDB.updatePassword(locals.user.id, id, hashedPassword)
      if (!passwordUpdated) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'パスワードの更新に失敗しました'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    // パスワード以外のユーザ情報の更新
    const user = await UserDB.updateUser(locals.user.id, id, {
      name: body.name,
      email: body.email,
      role: body.role,
      isEnabled: body.isEnabled
    })

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ユーザの更新に失敗しました'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: user
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error: unknown) {
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

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params
    const user = await UserDB.getUserById(Number(id))

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ユーザが見つかりませんでした'
        }),
        {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: user
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
