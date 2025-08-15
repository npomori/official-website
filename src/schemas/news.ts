import { z } from 'zod'

// ファイル添付のスキーマ
export const attachmentSchema = z
  .object({
    originalName: z.string(),
    filename: z.string()
  })
  .or(z.string()) // 文字列（ファイル名のみ）も許可

// 基本的なお知らせスキーマ
export const newsBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'タイトルは必須です' })
    .max(100, { message: 'タイトルは100文字以内で入力してください' }),
  content: z
    .string()
    .trim()
    .min(1, { message: '内容は必須です' })
    .max(5000, { message: '内容は5000文字以内で入力してください' }),
  date: z.date({ message: '日付は必須です' }),
  categories: z.array(z.string()).min(1, { message: 'カテゴリーは必須です' }),
  priority: z.string().nullable(),
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

// サーバー用（ID含む）
export const newsUpdateSchema = newsBaseSchema.extend({
  id: z.string().uuid({ message: '無効なIDです' }),
  attachments: z.array(attachmentSchema).optional()
})

// API用（文字列日付）
export const newsApiSchema = newsBaseSchema.extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日付の形式が正しくありません' }),
  attachments: z.array(attachmentSchema).optional()
})

// レスポンス用
export const newsResponseSchema = newsBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  attachments: z
    .array(
      z.object({
        id: z.string().uuid(),
        originalName: z.string(),
        serverName: z.string(),
        size: z.number(),
        mimeType: z.string()
      })
    )
    .optional()
})

// 型定義
export type NewsBase = z.infer<typeof newsBaseSchema>
export type NewsCreate = z.infer<typeof newsCreateSchema>
export type NewsUpdate = z.infer<typeof newsUpdateSchema>
export type NewsApi = z.infer<typeof newsApiSchema>
export type NewsResponse = z.infer<typeof newsResponseSchema>
export type NewsAttachmentType = z.infer<typeof attachmentSchema>

// バリデーション関数
export const validateNewsCreate = (data: unknown) => newsCreateSchema.parse(data)
export const validateNewsUpdate = (data: unknown) => newsUpdateSchema.parse(data)
export const validateNewsApi = (data: unknown) => newsApiSchema.parse(data)
