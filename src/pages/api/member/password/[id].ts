import { UserDB } from '@/server/db'
import { hash, verify } from '@/server/utils/password'
import type { APIRoute } from 'astro'

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const userId = Number(params.id)

  // アクセス権限をチェック
  // 自分のデータのみ編集可能
  const user = locals.user
  if (!user || user.id !== userId) {
    return new Response(JSON.stringify({ message: 'アクセス権限がありません' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
  const body = await request.json()
  const { currentPassword, newPassword } = body

  // ユーザ取得
  const userWithPassword = await UserDB.getUserById(userId)
  if (!userWithPassword) {
    return new Response(JSON.stringify({ message: 'ユーザが見つかりません' }), { status: 404 })
  }

  // 現在のパスワード検証
  const verified = await verify(currentPassword, userWithPassword.password)
  if (!verified) {
    return new Response(JSON.stringify({ message: '現在のパスワードが正しくありません' }), {
      status: 400
    })
  }

  // 新しいパスワードをハッシュ化して更新
  const hashed = await hash(newPassword)
  const updated = await UserDB.updatePassword(user.id, userId, hashed)
  if (!updated) {
    return new Response(JSON.stringify({ message: '更新に失敗しました' }), { status: 500 })
  }

  return new Response(JSON.stringify({ message: 'パスワードを更新しました' }), { status: 200 })
}
