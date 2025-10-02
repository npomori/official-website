import config from '@/config/config.json'
import { UserDB } from '@/server/db'
import Session from '@/server/utils/session'
import { type UserProfile, convertToUserProfile, profileSchema } from '@/types/profile'
import { type UserSessionData, convertToUserSessionData } from '@/types/user'
import type { APIRoute } from 'astro'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { z } from 'zod'

export const prerender = false

export const PUT: APIRoute = async (context) => {
  try {
    const { params, request, locals } = context
    const userId = Number(params.id)

    // アクセス権限をチェック
    // 自分のデータのみ編集可能
    const user = locals.user
    if (!user || user.id !== userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'アクセス権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // アップロードディレクトリの確認と作成
    const uploadDir = path.join(process.cwd(), config.upload.avatar.directory)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // FormDataの解析
    const formData = await request.formData()
    const name = formData.get('name')?.toString() ?? ''
    const email = formData.get('email')?.toString() ?? ''
    const biography = formData.get('biography')?.toString() ?? ''
    const avatarFile = formData.get('avatar') as File | null

    // バリデーション
    try {
      const validatedData = profileSchema.parse({
        name,
        email,
        biography
      })

      // プロフィール更新データの準備
      const updateData: {
        name: string
        email: string
        biography: string | null
        avatar?: string
      } = {
        name: validatedData.name,
        email: validatedData.email,
        biography: validatedData.biography || null
      }

      // アバター画像の処理
      if (avatarFile) {
        // ファイルサイズのバリデーション
        if (avatarFile.size > 500 * 1024) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '入力内容に問題があります',
              errors: { avatar: 'ファイルサイズは500KB以下にしてください' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // ファイル形式のバリデーション
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(avatarFile.type)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '入力内容に問題があります',
              errors: { avatar: 'JPG、PNG、GIF、WebP形式のファイルのみアップロード可能です' }
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        const fileBuffer = await avatarFile.arrayBuffer()
        const fileExt = 'webp'
        const timestamp = new Date().getTime()
        const fileName = `${userId}-${timestamp}.${fileExt}`
        const filePath = path.join(uploadDir, fileName)

        // 既存のアバター画像を削除
        const existingAvatar = await UserDB.getUserAvatarById(userId)

        if (existingAvatar) {
          const oldPath = path.join(uploadDir, existingAvatar)
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath)
          }
        }

        // 画像を正方形に加工してリサイズ
        const size = config.upload.avatar.size.width
        await sharp(Buffer.from(fileBuffer))
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: 70 })
          .toFile(filePath)

        updateData.avatar = fileName
      }

      // 名前の重複チェック
      let existingUser = await UserDB.getUserByName(updateData.name)
      if (existingUser && existingUser.id !== userId) {
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
      existingUser = await await UserDB.getUserByEmail(updateData.email)
      if (existingUser && existingUser.id !== userId) {
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

      // データベースの更新
      const updatedUser = await UserDB.updateUserProfile(userId, updateData)
      if (!updatedUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'プロフィールの更新に失敗しました'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      // セッション(ユーザ情報)更新
      const sessionData: UserSessionData = convertToUserSessionData(updatedUser)
      await Session.updateUser(context, sessionData)

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            biography: updatedUser.biography
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (err) {
      // バリデーションエラーを返す
      if (err instanceof z.ZodError) {
        // 各フィールドごとにエラーメッセージを配列でまとめる
        const errors = err.issues.reduce(
          (acc, error) => {
            const key = error.path[0]
            if (typeof key === 'string') {
              if (!acc[key]) acc[key] = []
              acc[key].push(error.message)
            }
            return acc
          },
          {} as Record<string, string[]>
        )
        return new Response(
          JSON.stringify({
            success: false,
            message: '入力内容に問題があります',
            errors
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      throw err
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'プロフィールの更新中にエラーが発生しました'
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

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const userId = Number(params.id)

    // アクセス権限をチェック
    // 自分のデータのみ編集可能
    const user = locals.user
    if (!user || user.id !== userId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'アクセス権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザ情報取得
    const userWithPassword = await UserDB.getUserById(userId)
    if (!userWithPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ユーザ情報が見つかりません'
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

    // セッション(ユーザ情報)作成
    const userProfile: UserProfile = convertToUserProfile(userWithPassword)

    return new Response(
      JSON.stringify({
        success: true,
        data: userProfile
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
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
