import config from '@/config/config.json'
import { z } from 'zod'

// 設定値を数値として取得
const NAME_MAX_LENGTH = config.contact.nameMaxLength as number
const EMAIL_MAX_LENGTH = config.contact.emailMaxLength as number
const MESSAGE_MAX_LENGTH = config.contact.messageMaxLength as number

/**
 * 入会申し込みフォームのバリデーションスキーマ
 */
export const JoinFormSchema = z.object({
  memberType: z.enum(['regular', 'support'], { message: '会員種別を選択してください' }),

  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(NAME_MAX_LENGTH, `お名前は${NAME_MAX_LENGTH}文字以内で入力してください`),

  furigana: z
    .string()
    .min(1, 'フリガナを入力してください')
    .max(NAME_MAX_LENGTH, `フリガナは${NAME_MAX_LENGTH}文字以内で入力してください`)
    .regex(/^[ァ-ヶー\s]+$/, 'カタカナで入力してください'),

  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .max(EMAIL_MAX_LENGTH, `メールアドレスは${EMAIL_MAX_LENGTH}文字以内で入力してください`),

  tel: z
    .string()
    .min(1, '電話番号を入力してください')
    .regex(/^[0-9-]+$/, '電話番号は数字とハイフンで入力してください')
    .max(20, '電話番号は20文字以内で入力してください'),

  address: z
    .string()
    .min(1, '住所を入力してください')
    .max(500, '住所は500文字以内で入力してください'),

  birthDate: z.string().min(1, '生年月日を入力してください'),

  occupation: z.string().max(100, '職業は100文字以内で入力してください').optional(),

  experience: z
    .string()
    .max(
      MESSAGE_MAX_LENGTH,
      `森林ボランティア経験は${MESSAGE_MAX_LENGTH}文字以内で入力してください`
    )
    .optional(),

  motivation: z
    .string()
    .min(10, '入会の動機は10文字以上入力してください')
    .max(MESSAGE_MAX_LENGTH, `入会の動機は${MESSAGE_MAX_LENGTH}文字以内で入力してください`),

  privacy: z.boolean().refine((val) => val === true, 'プライバシーポリシーに同意してください')
})

export type JoinFormData = z.infer<typeof JoinFormSchema>
