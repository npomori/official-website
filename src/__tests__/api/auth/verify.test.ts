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
      getUserByVerificationToken: vi.fn(),
      activateUserWithPassword: vi.fn()
    },
    validatePasswordStrength: vi.fn(),
    hash: vi.fn()
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
  mocks.hash.mockResolvedValue('$2b$10$hashedPassword')
  mocks.UserDB.activateUserWithPassword.mockResolvedValue(true)
})

const getVerifyHandler = async () => {
  const mod = await import('@/pages/api/auth/verify')
  return mod.POST
}

describe('POST /api/auth/verify', () => {
  describe('正常系', () => {
    it('有効なトークンとパスワードでユーザ認証に成功する', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'newuser@example.com',
        verificationToken: 'valid-verify-token-123',
        verificationExpires: new Date(Date.now() + 86400000) // 24時間後
      })

      mocks.UserDB.getUserByVerificationToken.mockResolvedValue(mockUser)

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'valid-verify-token-123',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'ユーザ認証が完了しました。ログインしてください。'
      })

      expect(mocks.UserDB.getUserByVerificationToken).toHaveBeenCalledWith('valid-verify-token-123')
      expect(mocks.validatePasswordStrength).toHaveBeenCalledWith('NewPassword123!')
      expect(mocks.hash).toHaveBeenCalledWith('NewPassword123!')
      expect(mocks.UserDB.activateUserWithPassword).toHaveBeenCalledWith(1, '$2b$10$hashedPassword')
    })
  })

  describe('バリデーション', () => {
    it('トークンが欠けている場合、400エラーを返す', async () => {
      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          password: 'NewPassword123!'
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

      expect(mocks.UserDB.getUserByVerificationToken).not.toHaveBeenCalled()
    })

    it('パスワードが欠けている場合、400エラーを返す', async () => {
      const handler = await getVerifyHandler()
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

      expect(mocks.UserDB.getUserByVerificationToken).not.toHaveBeenCalled()
    })

    it('パスワード強度が不十分な場合、422エラーを返す', async () => {
      mocks.validatePasswordStrength.mockReturnValue({
        valid: false,
        message: 'パスワードは8文字以上で、大文字、小文字、数字を含む必要があります'
      })

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token',
          password: 'weak'
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

      expect(mocks.UserDB.getUserByVerificationToken).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it('無効なトークンの場合、400エラーを返す', async () => {
      mocks.UserDB.getUserByVerificationToken.mockResolvedValue(null)

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'invalid-token',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: '認証リンクが無効です'
      })

      expect(mocks.hash).not.toHaveBeenCalled()
      expect(mocks.UserDB.activateUserWithPassword).not.toHaveBeenCalled()
    })

    it('トークンの有効期限が切れている場合、400エラーを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        verificationToken: 'expired-token',
        verificationExpires: new Date(Date.now() - 3600000) // 1時間前
      })

      mocks.UserDB.getUserByVerificationToken.mockResolvedValue(mockUser)

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'expired-token',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: '認証リンクの有効期限が切れています'
      })

      expect(mocks.hash).not.toHaveBeenCalled()
      expect(mocks.UserDB.activateUserWithPassword).not.toHaveBeenCalled()
    })

    it('verificationExpiresがnullの場合、400エラーを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        verificationToken: 'some-token',
        verificationExpires: null
      })

      mocks.UserDB.getUserByVerificationToken.mockResolvedValue(mockUser)

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: '認証リンクの有効期限が切れています'
      })
    })

    it('ユーザアクティベーションに失敗した場合、500エラーを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        verificationToken: 'valid-token',
        verificationExpires: new Date(Date.now() + 86400000)
      })

      mocks.UserDB.getUserByVerificationToken.mockResolvedValue(mockUser)
      mocks.UserDB.activateUserWithPassword.mockResolvedValue(false)

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'valid-token',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'ユーザの有効化に失敗しました'
      })

      expect(mocks.UserDB.activateUserWithPassword).toHaveBeenCalled()
    })

    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      mocks.UserDB.getUserByVerificationToken.mockRejectedValue(new Error('Database error'))

      const handler = await getVerifyHandler()
      const request = createMockAuthRequest({
        body: {
          token: 'some-token',
          password: 'NewPassword123!'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'ユーザ認証に失敗しました'
      })
    })
  })
})
