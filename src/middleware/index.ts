import { sequence } from 'astro/middleware'

import { auth } from './auth'
import { onRequest as errorHandler } from './error'
import { onRequest as ensureImageTransform } from './image'

// エラーハンドリングを最外層に配置
export const onRequest = sequence(errorHandler, ensureImageTransform, auth)
