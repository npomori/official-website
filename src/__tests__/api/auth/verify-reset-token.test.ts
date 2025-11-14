import {
  createMockAuthContext,
  createMockAuthRequest,
  createMockUser
} from '@/__tests__/helpers/auth-test-helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モックをホイストして定義
const mocks = vi.hoisted(() => {
  return {
    UserDB: {
      getUserByResetToken: vi.fn()
    }
  }
})

// モジュールをモック
vi.mock('@/server/db', () => ({
  UserDB: mocks.UserDB
}))

// レート制限ミドルウェアをモック（テスト対象外）
vi.mock('@/middleware/rate-limit', () => ({
  tokenVerificationRateLimiter: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const getVerifyResetTokenHandler = async () => {
  const mod = await import('@/pages/api/auth/verify-reset-token')
  return mod.GET
}

describe('GET /api/auth/verify-reset-token', () => {
  describe('正常系', () => {
    it('有効なトークンの場合、validがtrueを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        passwordResetToken: 'valid-token-123',
        passwordResetExpiresAt: new Date(Date.now() + 3600000) // 1時間後
      })

      mocks.UserDB.getUserByResetToken.mockResolvedValue(mockUser)

      const handler = await getVerifyResetTokenHandler()
      const request = createMockAuthRequest({
        method: 'GET',
        url: 'http://localhost:4321/api/auth/verify-reset-token?token=valid-token-123'
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: { valid: true },
        message: 'トークンは有効です'
      })

      expect(mocks.UserDB.getUserByResetToken).toHaveBeenCalledWith('valid-token-123')
    })
  })

  describe('バリデーション', () => {
    it('トークンが指定されていない場合、400エラーを返す', async () => {
      const handler = await getVerifyResetTokenHandler()
      const request = createMockAuthRequest({
        method: 'GET',
        url: 'http://localhost:4321/api/auth/verify-reset-token'
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        data: { valid: false },
        message: 'トークンが指定されていません'
      })

      expect(mocks.UserDB.getUserByResetToken).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it('無効なトークンの場合、validがfalseを返す', async () => {
      mocks.UserDB.getUserByResetToken.mockResolvedValue(null)

      const handler = await getVerifyResetTokenHandler()
      const request = createMockAuthRequest({
        method: 'GET',
        url: 'http://localhost:4321/api/auth/verify-reset-token?token=invalid-token'
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        data: { valid: false },
        message: 'リセットリンクが無効または期限切れです'
      })

      expect(mocks.UserDB.getUserByResetToken).toHaveBeenCalledWith('invalid-token')
    })

    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      mocks.UserDB.getUserByResetToken.mockRejectedValue(new Error('Database error'))

      const handler = await getVerifyResetTokenHandler()
      const request = createMockAuthRequest({
        method: 'GET',
        url: 'http://localhost:4321/api/auth/verify-reset-token?token=some-token'
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        data: { valid: false },
        message: 'トークン検証に失敗しました'
      })
    })
  })
})
