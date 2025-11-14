import {
  createMockAuthContext,
  createMockAuthRequest,
  createMockSessionData,
  createMockUser
} from '@/__tests__/helpers/auth-test-helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モックをホイストして定義
const mocks = vi.hoisted(() => {
  return {
    UserDB: {
      getUserByEmail: vi.fn(),
      updateLastLoginAt: vi.fn()
    },
    verify: vi.fn(),
    Session: {
      createUser: vi.fn()
    },
    Auth: {
      createRememberMe: vi.fn()
    },
    convertToUserSessionData: vi.fn()
  }
})

// モジュールをモック
vi.mock('@/server/db', () => ({
  UserDB: mocks.UserDB
}))

vi.mock('@/server/utils/password', () => ({
  verify: mocks.verify,
  hash: vi.fn(),
  validatePasswordStrength: vi.fn()
}))

vi.mock('@/server/utils/session', () => ({
  default: mocks.Session
}))

vi.mock('@/server/utils/auth', () => ({
  default: mocks.Auth
}))

vi.mock('@/types/user', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    convertToUserSessionData: mocks.convertToUserSessionData
  }
})

// レート制限ミドルウェアをモック（テスト対象外）
vi.mock('@/middleware/rate-limit', () => ({
  authRateLimiter: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.verify.mockResolvedValue(true)
  mocks.Session.createUser.mockResolvedValue(createMockSessionData())
  mocks.Auth.createRememberMe.mockResolvedValue(undefined)
  mocks.UserDB.updateLastLoginAt.mockResolvedValue(true)
  mocks.convertToUserSessionData.mockReturnValue(createMockSessionData())
})

const getLoginHandler = async () => {
  const mod = await import('@/pages/api/auth/login')
  return mod.POST
}

describe('POST /api/auth/login', () => {
  describe('正常系', () => {
    it('正しいメールアドレスとパスワードでログインに成功する', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'test@example.com',
        password: '$2b$10$hashedPassword',
        isEnabled: true
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com',
          password: 'CorrectPassword123!',
          rememberMe: false
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'ログインしました'
      })

      expect(mocks.UserDB.getUserByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mocks.verify).toHaveBeenCalledWith('CorrectPassword123!', '$2b$10$hashedPassword')
      expect(mocks.UserDB.updateLastLoginAt).toHaveBeenCalledWith(1)
      expect(mocks.Session.createUser).toHaveBeenCalledWith(context, expect.any(Object))
      expect(mocks.Auth.createRememberMe).not.toHaveBeenCalled()
    })

    it('Remember Meが有効な場合、Remember Meトークンを作成する', async () => {
      const mockUser = createMockUser({
        id: 1,
        email: 'test@example.com',
        isEnabled: true
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com',
          password: 'CorrectPassword123!',
          rememberMe: true
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mocks.Session.createUser).toHaveBeenCalled()
      expect(mocks.Auth.createRememberMe).toHaveBeenCalledWith(context, 1)
    })
  })

  describe('バリデーション', () => {
    it('Content-Typeがapplication/jsonでない場合、400エラーを返す', async () => {
      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        headers: { 'Content-Type': 'text/plain' },
        body: {
          email: 'test@example.com',
          password: 'password'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'リクエストのフォーマットが不正です'
      })

      expect(mocks.UserDB.getUserByEmail).not.toHaveBeenCalled()
    })

    it('メールアドレスが欠けている場合、400エラーを返す', async () => {
      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          password: 'password'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'Eメールとパスワードが必要です'
      })

      expect(mocks.UserDB.getUserByEmail).not.toHaveBeenCalled()
    })

    it('パスワードが欠けている場合、400エラーを返す', async () => {
      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'Eメールとパスワードが必要です'
      })

      expect(mocks.UserDB.getUserByEmail).not.toHaveBeenCalled()
    })
  })

  describe('異常系', () => {
    it('存在しないメールアドレスの場合、401エラーを返す', async () => {
      mocks.UserDB.getUserByEmail.mockResolvedValue(null)

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        message: 'Eメールまたはパスワードが不正です'
      })

      expect(mocks.verify).not.toHaveBeenCalled()
      expect(mocks.Session.createUser).not.toHaveBeenCalled()
    })

    it('パスワードが一致しない場合、401エラーを返す', async () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
        password: '$2b$10$hashedPassword',
        isEnabled: true
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)
      mocks.verify.mockResolvedValue(false)

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com',
          password: 'WrongPassword'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        message: 'Eメールまたはパスワードが不正です'
      })

      expect(mocks.verify).toHaveBeenCalledWith('WrongPassword', '$2b$10$hashedPassword')
      expect(mocks.Session.createUser).not.toHaveBeenCalled()
    })

    it('ユーザが無効化されている場合、403エラーを返す', async () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
        isEnabled: false
      })

      mocks.UserDB.getUserByEmail.mockResolvedValue(mockUser)

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com',
          password: 'password'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        success: false,
        message: 'このアカウントは無効化されています'
      })

      expect(mocks.verify).not.toHaveBeenCalled()
      expect(mocks.Session.createUser).not.toHaveBeenCalled()
    })

    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      mocks.UserDB.getUserByEmail.mockRejectedValue(new Error('Database error'))

      const handler = await getLoginHandler()
      const request = createMockAuthRequest({
        body: {
          email: 'test@example.com',
          password: 'password'
        }
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'ログインに失敗しました'
      })
    })
  })
})
