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
      getUserByEmail: vi.fn(),
      setPasswordResetToken: vi.fn()
    },
    sendPasswordResetEmail: vi.fn(),
    crypto: {
      randomBytes: vi.fn()
    }
  }
})

// モジュールをモック
vi.mock('@/server/db', () => ({
  UserDB: mocks.UserDB
}))

vi.mock('@/server/utils/email', () => ({
  sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  sendContactEmail: vi.fn(),
  sendVerificationEmail: vi.fn()
}))

vi.mock('node:crypto', () => ({
  default: {
    randomBytes: mocks.crypto.randomBytes
  }
}))

// レート制限ミドルウェアをモック（テスト対象外）
vi.mock('@/middleware/rate-limit', () => ({
  passwordResetRateLimiter: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.UserDB.setPasswordResetToken.mockResolvedValue(true)
  mocks.sendPasswordResetEmail.mockResolvedValue(undefined)
  mocks.crypto.randomBytes.mockReturnValue({
    toString: () => 'mock-random-token-123456789abcdef'
  } as any)
})

const getForgotPasswordHandler = async () => {
  const mod = await import('@/pages/api/auth/forgot-password')
  return mod.POST
}

describe('POST /api/auth/forgot-password', () => {
  describe('正常系', () => {
    it('有効なメールアドレスで、パスワードリセット申請に成功する', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'test@example.com',
        name: 'テストユーザー',
        isEnabled: true
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)

      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
      })

      expect(mocks.UserDB.getUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mocks.UserDB.setPasswordResetToken).toHaveBeenCalledWith(
        1,
        'mock-random-token-123456789abcdef',
        expect.any(Date)
      )
      expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith({
        name: 'テストユーザー',
        email: 'test@example.com',
        resetToken: 'mock-random-token-123456789abcdef',
        expiresInMinutes: 60
      })
    })

    it('存在しないメールアドレスでも、セキュリティのため成功レスポンスを返す', async () => {
      mocks.UserDB.getUserByEmail.mockResolvedValue(null)

      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'nonexistent@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
      })

      expect(mocks.UserDB.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com')
      expect(mocks.UserDB.setPasswordResetToken).not.toHaveBeenCalled()
      expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('無効化されたユーザでも、セキュリティのため成功レスポンスを返す', async () => {
      const mockUser = createMockUser({
        email: 'disabled@example.com',
        isEnabled: false
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)

      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'disabled@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mocks.UserDB.setPasswordResetToken).not.toHaveBeenCalled()
      expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
    })
  })

  describe('バリデーション', () => {
    it('メールアドレスが欠けている場合、400エラーを返す', async () => {
      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {}
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'メールアドレスを入力してください'
      })

      expect(mocks.UserDB.getUserByEmail).not.toHaveBeenCalled()
    })

    it('メールアドレスの形式が不正な場合、400エラーを返す', async () => {
      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'invalid-email-format'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: '有効なメールアドレスを入力してください'
      })

      expect(mocks.UserDB.getUserByEmail).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it('トークン保存に失敗した場合、500エラーを返す', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'test@example.com',
        isEnabled: true
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)
      mocks.UserDB.setPasswordResetToken.mockResolvedValue(false)

      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'パスワードリセット申請に失敗しました'
      })

      expect(mocks.UserDB.setPasswordResetToken).toHaveBeenCalled()
      expect(mocks.sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      mocks.UserDB.getUserByEmail.mockRejectedValue(new Error('Database error'))

      const handler = await getForgotPasswordHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'パスワードリセット申請に失敗しました'
      })
    })
  })
})
