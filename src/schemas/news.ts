import config from '@/types/config'
import { z } from 'zod'

// ファイル添付のスキーマ
export const attachmentSchema = z
  .object({
    name: z.string(),
    filename: z.string(),
    size: z.number().optional().default(0)
  })
  .or(z.string()) // 文字列（ファイル名のみ）も許可

// 基本的なお知らせスキーマ
const TITLE_MAX = config.content.titleMaxLength ?? 100

export const newsBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'タイトルは必須です' })
    .max(TITLE_MAX, { message: `タイトルは${TITLE_MAX}文字以内で入力してください` }),
  content: z
    .string()
    .trim()
    .min(1, { message: '内容は必須です' })
    .max(5000, { message: '内容は5000文字以内で入力してください' }),
  date: z.date({ message: '日付は必須です' }),
  categories: z.array(z.string()).min(1, { message: 'カテゴリーは必須です' }),
  priority: z.string().nullable(),
  isMemberOnly: z.boolean().default(false),
  author: z
    .string()
    .trim()
    .min(1, { message: '作成者は必須です' })
    .max(50, { message: '作成者は50文字以内で入力してください' })
})

// フロントエンド用（ファイル含む）
export const newsCreateSchema = newsBaseSchema.extend({
  attachments: z.array(attachmentSchema).optional()
})

// API用（文字列日付）
export const newsApiSchema = newsBaseSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日付の形式が正しくありません' }),
  attachments: z.array(attachmentSchema).optional()
})

// 型定義
export type NewsCreate = z.infer<typeof newsCreateSchema>
export type NewsApi = z.infer<typeof newsApiSchema>

// バリデーション関数
export const validateNewsCreate = (data: unknown) => newsCreateSchema.parse(data)
export const validateNewsApi = (data: unknown) => newsApiSchema.parse(data)
