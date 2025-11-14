import { createMockAuthContext, createMockAuthRequest } from '@/__tests__/helpers/auth-test-helpers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モックをホイストして定義
const mocks = vi.hoisted(() => {
  return {
    Session: {
      deleteUser: vi.fn()
    },
    Auth: {
      removeRememberMe: vi.fn()
    }
  }
})

// モジュールをモック
vi.mock('@/server/utils/session', () => ({
  default: mocks.Session
}))

vi.mock('@/server/utils/auth', () => ({
  default: mocks.Auth
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.Session.deleteUser.mockResolvedValue(1)
  mocks.Auth.removeRememberMe.mockResolvedValue(undefined)
})

const getLogoutHandler = async () => {
  const mod = await import('@/pages/api/auth/logout')
  return mod.POST
}

describe('POST /api/auth/logout', () => {
  describe('正常系', () => {
    it('ログアウトに成功する', async () => {
      const handler = await getLogoutHandler()
      const request = createMockAuthRequest({
        body: {}
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'ログアウトしました'
      })

      expect(mocks.Session.deleteUser).toHaveBeenCalledWith(context)
      expect(mocks.Auth.removeRememberMe).toHaveBeenCalledWith(context, 1)
    })

    it('ユーザIDが取得できなくてもRemember Meトークンを削除する', async () => {
      mocks.Session.deleteUser.mockResolvedValue(null)

      const handler = await getLogoutHandler()
      const request = createMockAuthRequest({
        body: {}
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mocks.Auth.removeRememberMe).toHaveBeenCalledWith(context, null)
    })
  })

  describe('異常系', () => {
    it('セッション削除でエラーが発生した場合、500エラーを返す', async () => {
      mocks.Session.deleteUser.mockRejectedValue(new Error('Redis error'))

      const handler = await getLogoutHandler()
      const request = createMockAuthRequest({
        body: {}
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'ログアウトに失敗しました'
      })
    })

    it('Remember Me削除でエラーが発生した場合、500エラーを返す', async () => {
      mocks.Auth.removeRememberMe.mockRejectedValue(new Error('Database error'))

      const handler = await getLogoutHandler()
      const request = createMockAuthRequest({
        body: {}
      })
      const context = createMockAuthContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'ログアウトに失敗しました'
      })
    })
  })
})
