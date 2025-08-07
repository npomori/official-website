import { Activity } from '@/server/utils/activity'
import type { User } from '@prisma/client'
import BaseDB from './base'

class UserDB extends BaseDB {
  async getUsers(): Promise<User[]> {
    try {
      const users = await BaseDB.prisma.user.findMany({
        orderBy: [
          {
            id: 'desc'
          }
        ]
      })
      return users
    } catch (err) {
      console.error(err)
      return []
    }
  }
  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await BaseDB.prisma.user.findUnique({
        where: { id }
      })
      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await BaseDB.prisma.user.findUnique({
        where: {
          email: email
        }
      })
      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }
  async getUserByRememberMeToken(token: string): Promise<User | null> {
    try {
      const user = await BaseDB.prisma.user.findUnique({
        where: {
          rememberMeToken: token,
          rememberMeTokenExpiry: {
            gte: new Date()
          }
        }
      })
      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }
  async updateRememberMe(
    id: number,
    token: string | null,
    tokenExpiry: Date | null
  ): Promise<User | null> {
    try {
      const user = await BaseDB.prisma.user.update({
        where: { id: id },
        data: {
          rememberMeToken: token,
          rememberMeTokenExpiry: tokenExpiry
        }
      })
      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // プロフィール更新用メソッド
  async updateUserProfile(
    id: number,
    data: { name: string; email: string; biography: string | null; avatar?: string }
  ): Promise<User | null> {
    try {
      // 更新前のユーザー情報を取得
      const currentUser = await BaseDB.prisma.user.findUnique({
        where: { id }
      })

      if (!currentUser) {
        return null
      }

      // 変更されたフィールドを特定
      const updatedFields: Record<string, unknown> = {}
      const changedFields: string[] = []
      if (data.name !== currentUser.name) {
        updatedFields.name = data.name
        changedFields.push(`名前: ${currentUser.name} → ${data.name}`)
      }
      if (data.email !== currentUser.email) {
        updatedFields.email = data.email
        changedFields.push(`メールアドレス: ${currentUser.email} → ${data.email}`)
      }
      if (data.biography !== currentUser.biography) {
        updatedFields.biography = data.biography
        changedFields.push(
          `自己紹介: ${currentUser.biography || 'なし'} → ${data.biography || 'なし'}`
        )
      }
      // アバターの変更チェックを改善
      const currentAvatar = currentUser.avatar || 'なし'
      const newAvatar = data.avatar || 'なし'
      if (currentAvatar !== newAvatar) {
        updatedFields.avatar = data.avatar
        changedFields.push(`アバター: ${currentAvatar} → ${newAvatar}`)
      }

      const user = await BaseDB.prisma.user.update({
        where: { id },
        data
      })

      // プロフィール更新のアクティビティログを記録
      await Activity.logUserProfileUpdate(
        id,
        updatedFields,
        `以下の項目を更新しました:\n${changedFields.join('\n')}`
      )

      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // アバター名取得用メソッド
  async getUserAvatarById(id: number): Promise<string | null> {
    try {
      const user = await BaseDB.prisma.user.findUnique({
        where: { id },
        select: { avatar: true }
      })
      return user?.avatar || null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // パスワード更新用メソッド
  async updatePassword(
    userId: number,
    targetUserId: number,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      const targetUser = await BaseDB.prisma.user.update({
        where: { id: targetUserId },
        data: { password: hashedPassword }
      })
      // パスワード変更のアクティビティログを記録
      await Activity.logPasswordUpdate(userId, targetUserId, targetUser.name)
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  // ユーザー作成用メソッド
  async addUser(
    userId: number,
    data: {
      name: string
      email: string
      password: string
      role: string
    }
  ): Promise<User | null> {
    try {
      // ユーザーの作成
      const user = await BaseDB.prisma.user.create({
        data
      })

      // ユーザー作成のアクティビティログを記録
      await Activity.logUserCreate(
        userId, // ユーザを作成したユーザーID
        user.id,
        user.name,
        {
          name: user.name,
          email: user.email,
          role: user.role,
          isEnabled: user.isEnabled
        }
      )

      return user
    } catch (err) {
      console.error('ユーザー作成エラー:', err)
      return null
    }
  }

  async getUserByName(name: string): Promise<User | null> {
    try {
      const user = await BaseDB.prisma.user.findFirst({
        where: {
          name: name
        }
      })
      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async deleteUser(userId: number, id: number): Promise<User | null> {
    try {
      // 削除前にユーザー情報を取得
      const user = await BaseDB.prisma.user.findUnique({
        where: { id }
      })

      if (!user) {
        return null
      }

      // ユーザーを削除
      const deletedUser = await BaseDB.prisma.user.delete({
        where: { id }
      })

      // ユーザー削除のアクティビティログを記録
      await Activity.logUserDelete(
        userId, // 削除を実行したユーザーID
        deletedUser.id,
        deletedUser.name
      )

      return deletedUser
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // ユーザー更新用メソッド
  async updateUser(
    userId: number,
    id: number,
    data: {
      name: string
      email: string
      role: string
      isEnabled: boolean
    }
  ): Promise<User | null> {
    try {
      // 更新前のユーザー情報を取得
      const currentUser = await BaseDB.prisma.user.findUnique({
        where: { id }
      })

      if (!currentUser) {
        return null
      }

      // 変更されたフィールドを特定
      const updatedFields: Record<string, unknown> = {}
      if (data.name !== currentUser.name) updatedFields.name = data.name
      if (data.email !== currentUser.email) updatedFields.email = data.email
      if (data.role !== currentUser.role) updatedFields.role = data.role
      if (data.isEnabled !== currentUser.isEnabled) updatedFields.isEnabled = data.isEnabled

      // ユーザーを更新
      const user = await BaseDB.prisma.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          role: data.role,
          isEnabled: data.isEnabled
        }
      })

      // ユーザー更新のアクティビティログを記録
      await Activity.logUserUpdate(
        userId, // 更新を実行したユーザーID
        user.id,
        user.name,
        updatedFields
      )

      return user
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async updateLastLoginAt(userId: number): Promise<void> {
    try {
      await BaseDB.prisma.user.update({
        where: {
          id: userId
        },
        data: {
          lastLoginAt: new Date()
        }
      })
    } catch (err) {
      console.error(err)
    }
  }
}
export default new UserDB()
