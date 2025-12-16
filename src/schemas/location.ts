import config from '@/types/config'
import { z } from 'zod'

// ファイル添付のスキーマ
export const attachmentSchema = z.object({
  name: z.string(),
  filename: z.string(),
  size: z.number()
})

// 画像添付のスキーマ（ギャラリー画像用）
export const imageAttachmentSchema = attachmentSchema.extend({
  caption: z
    .string()
    .max(config.upload.location.captionMaxLength ?? 30, {
      message: `キャプションは${config.upload.location.captionMaxLength ?? 30}文字以内で入力してください`
    })
    .optional()
})

// 基本的な活動地スキーマ
const TITLE_MAX = config.content.titleMaxLength ?? 100

export const locationBaseSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, { message: 'IDは必須です' })
    .max(50, { message: 'IDは50文字以内で入力してください' })
    .regex(/^[a-z0-9-]+$/, { message: 'IDは小文字英数字とハイフンのみ使用できます' }),
  name: z
    .string()
    .trim()
    .min(1, { message: '活動地名は必須です' })
    .max(TITLE_MAX, { message: `活動地名は${TITLE_MAX}文字以内で入力してください` }),
  position: z
    .array(z.number())
    .length(2, { message: '位置情報は[緯度, 経度]の形式で入力してください' }),
  type: z.enum(['regular', 'collaboration', 'other'], { message: 'タイプは必須です' }),
  activities: z
    .string()
    .trim()
    .max(config.content.location?.activitiesMaxLength ?? 200, {
      message: `活動内容は${config.content.location?.activitiesMaxLength ?? 200}文字以内で入力してください`
    })
    .nullable()
    .optional(),
  image: z.string().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  hasDetail: z.boolean(),
  isDraft: z.boolean().optional(),

  // 詳細情報
  activityDetails: z.string().trim().nullable().optional(),
  fieldCharacteristics: z.string().trim().nullable().optional(),
  access: z.string().trim().nullable().optional(),
  facilities: z.string().trim().nullable().optional(),
  schedule: z.string().trim().nullable().optional(),
  requirements: z.string().trim().nullable().optional(),
  participationFee: z.string().trim().nullable().optional(),
  contact: z.string().trim().nullable().optional(),
  organizer: z.string().trim().nullable().optional(),
  startedDate: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  other: z.string().trim().nullable().optional(),

  // 集合場所情報
  meetingAddress: z.string().trim().nullable().optional(),
  meetingTime: z.string().trim().nullable().optional(),
  meetingMapUrl: z
    .string()
    .url({ message: '地図URLの形式が正しくありません' })
    .nullable()
    .optional()
    .or(z.literal('')),
  meetingAdditionalInfo: z.string().trim().nullable().optional(),

  // メディア・添付ファイル
  images: z.array(imageAttachmentSchema).nullable().optional(),
  attachments: z.array(attachmentSchema).nullable().optional(),
  upcomingDates: z.array(z.string()).nullable().optional()
})

// フロントエンド用（ファイル含む）
export const locationCreateSchema = locationBaseSchema

// サーバー用（更新時）
export const locationUpdateSchema = locationBaseSchema.extend({
  id: z.string()
})

// API用
export const locationApiSchema = locationBaseSchema

// 型定義
export type LocationBase = z.infer<typeof locationBaseSchema>
export type LocationCreate = z.infer<typeof locationCreateSchema>
export type LocationUpdate = z.infer<typeof locationUpdateSchema>
export type LocationApi = z.infer<typeof locationApiSchema>
export type LocationAttachmentType = z.infer<typeof attachmentSchema>

// バリデーション関数
export const validateLocationCreate = (data: unknown) => locationCreateSchema.parse(data)
export const validateLocationUpdate = (data: unknown) => locationUpdateSchema.parse(data)
export const validateLocationApi = (data: unknown) => locationApiSchema.parse(data)
