import { sequence } from 'astro/middleware'

import { auth } from './auth'
import { onRequest as errorHandler } from './error'

// エラーハンドリングを最外層に配置
export const onRequest = sequence(errorHandler, auth)
