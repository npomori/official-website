import { z } from 'zod'

// プロフィールのバリデーションスキーマ
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(10, 'お名前は10文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  biography: z
    .string()
    .max(100, '自己紹介は100文字以内で入力してください')
    .optional()
    .transform((v) => v || ''),
  avatar: z.string().optional()
})

export type ProfileFormData = z.infer<typeof profileSchema>

// レスポンス型
export interface MemberProfileResponse {
  id: number
  name: string
  email: string
  biography: string | null
  avatar: string | null
}

// プロフィール情報
export interface UserProfile {
  id: number
  name: string
  email: string
  avatar: string
  biography: string
}

// ユーザ情報からプロフィール情報に変換(必要な情報だけ抽出)
export const convertToUserProfile = (user: any): UserProfile => {
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    biography: user.biography
  }
  return userProfile
}
