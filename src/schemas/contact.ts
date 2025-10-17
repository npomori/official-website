import config from '@/config/config.json'
import contactSubjects from '@/config/contact-subject.json'
import { z } from 'zod'

// 設定値を数値として取得
const NAME_MAX_LENGTH = config.contact.nameMaxLength as number
const EMAIL_MAX_LENGTH = config.contact.emailMaxLength as number
const MESSAGE_MAX_LENGTH = config.contact.messageMaxLength as number

// 許可される件名の値をJSONから取得
const ALLOWED_SUBJECTS = contactSubjects.map((item) => item.value)

/**
 * お問い合わせフォームのバリデーションスキーマ
 */
export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(NAME_MAX_LENGTH, `お名前は${NAME_MAX_LENGTH}文字以内で入力してください`),

  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .max(EMAIL_MAX_LENGTH, `メールアドレスは${EMAIL_MAX_LENGTH}文字以内で入力してください`),

  memberType: z.enum(['member', 'non-member'], { message: '会員種別を選択してください' }),

  subject: z
    .string()
    .min(1, '件名を選択してください')
    .refine((val) => ALLOWED_SUBJECTS.includes(val), '有効な件名を選択してください'),

  message: z
    .string()
    .min(10, 'お問い合わせ内容は10文字以上入力してください')
    .max(MESSAGE_MAX_LENGTH, `お問い合わせ内容は${MESSAGE_MAX_LENGTH}文字以内で入力してください`),

  privacy: z.boolean().refine((val) => val === true, 'プライバシーポリシーに同意してください')
})

export type ContactFormData = z.infer<typeof ContactFormSchema>
