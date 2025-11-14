import { sequence } from 'astro/middleware'

import { auth } from './auth'
import { csrf } from './csrf'
import { onRequest as errorHandler } from './error'
import { onRequest as ensureImageTransform } from './image'

// エラーハンドリングを最外層に配置
// CSRFは認証の前に実行（トークン生成が必要なため）
export const onRequest = sequence(errorHandler, csrf, ensureImageTransform, auth)
