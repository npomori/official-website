import config from '@/types/config'
import { z } from 'zod'

// 記録データのスキーマ
const TITLE_MAX = config.content.titleMaxLength ?? 100

export const RecordDataSchema = z.object({
  location: z
    .string()
    .trim()
    .min(1, '活動場所は必須です')
    .max(TITLE_MAX, `活動場所は${TITLE_MAX}文字以内で入力してください`),
  datetime: z
    .string()
    .trim()
    .min(1, '活動日は必須です')
    .max(100, '活動日は100文字以内で入力してください'),
  weather: z
    .string()
    .trim()
    .min(1, '天候は必須です')
    .max(200, '天候は200文字以内で入力してください'),
  participants: z
    .string()
    .trim()
    .min(1, '参加者は必須です')
    .max(500, '参加者は500文字以内で入力してください'),
  reporter: z
    .string()
    .trim()
    .min(1, '報告者は必須です')
    .max(100, '報告者は100文字以内で入力してください'),
  content: z
    .string()
    .trim()
    .min(1, '活動内容は必須です')
    .max(2000, '活動内容は2000文字以内で入力してください'),
  nearMiss: z.string().trim().max(1000, 'ヒヤリハットは1000文字以内で入力してください').optional(),
  equipment: z.string().trim().max(500, '動力使用は500文字以内で入力してください').optional(),
  remarks: z.string().trim().max(1000, '備考は1000文字以内で入力してください').optional(),
  categories: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isDraft: z.boolean().optional()
})

// APIリクエストのスキーマ
export const RecordRequestSchema = z.object({
  dateForFilename: z.string().regex(/^\d{8}$/, '日付はYYYYMMDD形式で入力してください'),
  data: RecordDataSchema
})

// 型定義
export type RecordData = z.infer<typeof RecordDataSchema>
export type RecordRequest = z.infer<typeof RecordRequestSchema>

// バリデーション関数
export const validateRecordData = (data: unknown): RecordData => {
  return RecordDataSchema.parse(data)
}

export const validateRecordRequest = (data: unknown): RecordRequest => {
  return RecordRequestSchema.parse(data)
}

// 安全なバリデーション関数（エラーを返す）
export const safeValidateRecordData = (
  data: unknown
): { success: true; data: RecordData } | { success: false; error: string } => {
  try {
    const validatedData = RecordDataSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: firstError?.message || 'バリデーションエラーが発生しました' }
    }
    return { success: false, error: 'バリデーションエラーが発生しました' }
  }
}

export const safeValidateRecordRequest = (
  data: unknown
): { success: true; data: RecordRequest } | { success: false; error: string } => {
  try {
    const validatedData = RecordRequestSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: firstError?.message || 'バリデーションエラーが発生しました' }
    }
    return { success: false, error: 'バリデーションエラーが発生しました' }
  }
}
