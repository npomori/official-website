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
      getUserByResetToken: vi.fn(),
      updatePasswordAndClearResetToken: vi.fn()
    },
    validatePasswordStrength: vi.fn(),
    hash: vi.fn(),
    Session: {
      deleteUserSessions: vi.fn()
    }
  }
})

// モジュールをモック
vi.mock('@/server/db', () => ({
  UserDB: mocks.UserDB
}))

vi.mock('@/server/utils/password', () => ({
  validatePasswordStrength: mocks.validatePasswordStrength,
  hash: mocks.hash,
  verify: vi.fn()
}))

vi.mock('@/server/utils/session', () => ({
  default: mocks.Session
}))

// レート制限ミドルウェアをモック（テスト対象外）
vi.mock('@/middleware/rate-limit', () => ({
  authRateLimiter: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.validatePasswordStrength.mockReturnValue({
    valid: true,
    message: ''
  })
  mocks.hash.mockResolvedValue('$2b$10$newHashedPassword')
  mocks.Session.deleteUserSessions.mockResolvedValue(2)
})

const getResetPasswordHandler = async () => {
  const mod = await import('@/pages/api/auth/reset-password')
  return mod.POST
}

describe('POST /api/auth/reset-password', () => {
  describe('正常系', () => {
    it('有効なトークンと新しいパスワードでパスワードリセットに成功する', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'test@example.com',
        passwordResetToken: 'valid-reset-token-123',
        passwordResetExpiresAt: new Date(Date.now() + 3600000) // 1時間後
      })

      mocks.UserDB.getUserByResetToken.mockResolvedValue(mockUser)
      mocks.UserDB.updatePasswordAndClearResetToken.mockResolvedValue(true)

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'valid-reset-token-123',
          newPassword: 'NewSecurePassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message:
          'パスワードを変更しました。セキュリティのため、すべてのデバイスからログアウトされました。新しいパスワードでログインしてください。'
      })

      // 各関数が正しく呼ばれたか確認
      expect(mocks.UserDB.getUserByResetToken).toHaveBeenCalledWith('valid-reset-token-123')
      expect(mocks.validatePasswordStrength).toHaveBeenCalledWith('NewSecurePassword123!')
      expect(mocks.hash).toHaveBeenCalledWith('NewSecurePassword123!')
      expect(mocks.UserDB.updatePasswordAndClearResetToken).toHaveBeenCalledWith(
        1,
        '$2b$10$newHashedPassword'
      )
      expect(mocks.Session.deleteUserSessions).toHaveBeenCalledWith(1, context)
    })

    it('セッション削除に失敗してもパスワードリセットは成功する', async () => {
      const mockUser = createMockUser({
        id: 1,
        passwordResetToken: 'valid-token'
      })

      mocks.UserDB.getUserByResetToken.mockResolvedValue(mockUser)
      mocks.UserDB.updatePasswordAndClearResetToken.mockResolvedValue(true)
      mocks.Session.deleteUserSessions.mockRejectedValue(new Error('Redis connection error'))

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'valid-token',
          newPassword: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.UserDB.updatePasswordAndClearResetToken).toHaveBeenCalled()
    })
  })

  describe('バリデーション', () => {
    it('トークンが欠けている場合、400エラーを返す', async () => {
      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          newPassword: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'トークンとパスワードを入力してください'
      })

      expect(mocks.UserDB.getUserByResetToken).not.toHaveBeenCalled()
    })

    it('パスワードが欠けている場合、400エラーを返す', async () => {
      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'トークンとパスワードを入力してください'
      })

      expect(mocks.UserDB.getUserByResetToken).not.toHaveBeenCalled()
    })

    it('パスワード強度が不十分な場合、422エラーを返す', async () => {
      mocks.validatePasswordStrength.mockReturnValue({
        valid: false,
        message: 'パスワードは8文字以上で、大文字、小文字、数字を含む必要があります'
      })

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token',
          newPassword: 'weak'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data).toEqual({
        success: false,
        message: 'パスワードは8文字以上で、大文字、小文字、数字を含む必要があります'
      })

      expect(mocks.UserDB.getUserByResetToken).not.toHaveBeenCalled()
      expect(mocks.hash).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it('無効なトークンの場合、400エラーを返す', async () => {
      mocks.UserDB.getUserByResetToken.mockResolvedValue(null)

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'invalid-token',
          newPassword: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'リセットリンクが無効または期限切れです'
      })

      expect(mocks.UserDB.getUserByResetToken).toHaveBeenCalledWith('invalid-token')
      expect(mocks.hash).not.toHaveBeenCalled()
      expect(mocks.UserDB.updatePasswordAndClearResetToken).not.toHaveBeenCalled()
    })

    it('パスワード更新に失敗した場合、500エラーを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        passwordResetToken: 'valid-token'
      })

      mocks.UserDB.getUserByResetToken.mockResolvedValue(mockUser)
      mocks.UserDB.updatePasswordAndClearResetToken.mockResolvedValue(false)

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'valid-token',
          newPassword: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'パスワードの更新に失敗しました'
      })

      expect(mocks.UserDB.updatePasswordAndClearResetToken).toHaveBeenCalled()
      expect(mocks.Session.deleteUserSessions).not.toHaveBeenCalled()
    })

    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      mocks.UserDB.getUserByResetToken.mockRejectedValue(new Error('Database connection error'))

      const handler = await getResetPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token',
          newPassword: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'パスワードリセットに失敗しました'
      })
    })
  })
})
