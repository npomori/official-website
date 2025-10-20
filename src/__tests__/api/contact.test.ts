import { beforeEach, describe, expect, it, vi } from 'vitest'

// モックをホイストして定義
const mocks = vi.hoisted(() => {
  return {
    config: {
      site: {
        contact: {
          enabled: true
        }
      }
    },
    validateCsrfForPost: vi.fn<(request: Request) => boolean>(),
    sendContactEmail:
      vi.fn<
        (data: {
          name: string
          email: string
          memberType: 'member' | 'non-member'
          subject: string
          message: string
        }) => Promise<void>
      >(),
    ContactFormSchema: {
      safeParse:
        vi.fn<
          (data: unknown) => { success: boolean; data?: unknown; error?: { issues: unknown[] } }
        >()
    }
  }
})

// モジュールをモック
vi.mock('@/config/config.json', () => ({
  default: mocks.config
}))

vi.mock('@/server/utils/csrf', () => ({
  validateCsrfForPost: mocks.validateCsrfForPost
}))

vi.mock('@/server/utils/email', () => ({
  sendContactEmail: mocks.sendContactEmail
}))

vi.mock('@/schemas/contact', () => ({
  ContactFormSchema: mocks.ContactFormSchema
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.config.site.contact.enabled = true
  mocks.validateCsrfForPost.mockReturnValue(true)
  mocks.sendContactEmail.mockResolvedValue()
  mocks.ContactFormSchema.safeParse.mockReturnValue({
    success: true,
    data: {
      name: 'テスト太郎',
      email: 'test@example.com',
      memberType: 'member',
      subject: 'inquiry',
      message: 'これはテストメッセージです。'.repeat(2),
      privacy: true
    }
  })
})

const getContactHandler = async () => {
  const mod = await import('@/pages/api/contact')
  return mod.POST
}

const createMockRequest = (options: {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  url?: string
}): Request => {
  const {
    method = 'POST',
    headers = {},
    body = {},
    url = 'http://localhost:4321/api/contact'
  } = options

  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      origin: 'http://localhost:4321',
      ...headers
    },
    body: method !== 'GET' ? JSON.stringify(body) : undefined
  })
}

const createMockContext = (request: Request) => ({
  request,
  params: {},
  url: new URL(request.url),
  locals: {},
  cookies: {} as any,
  redirect: vi.fn(),
  rewrite: vi.fn(),
  props: {},
  site: new URL('http://localhost:4321'),
  generator: 'Astro',
  clientAddress: '127.0.0.1',
  isPrerendered: false,
  routePattern: '/api/contact',
  currentLocale: undefined,
  preferredLocale: undefined,
  preferredLocaleList: undefined,
  getActionResult: vi.fn(),
  callAction: vi.fn()
})

describe('POST /api/contact', () => {
  describe('機能の有効/無効チェック', () => {
    it('お問い合わせ機能が無効の場合、503エラーを返す', async () => {
      // 機能を無効化
      mocks.config.site.contact.enabled = false

      const handler = await getContactHandler()
      const request = createMockRequest({
        body: {
          name: 'テスト太郎',
          email: 'test@example.com',
          memberType: 'member',
          subject: 'inquiry',
          message: 'テストメッセージ'.repeat(2),
          privacy: true
        }
      })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data).toEqual({
        success: false,
        message: '現在、お問い合わせ機能は利用できません'
      })
      expect(mocks.validateCsrfForPost).not.toHaveBeenCalled()
      expect(mocks.sendContactEmail).not.toHaveBeenCalled()
    })

    it('お問い合わせ機能が有効の場合、正常に処理される', async () => {
      // 機能を有効化
      mocks.config.site.contact.enabled = true

      const handler = await getContactHandler()
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.sendContactEmail).toHaveBeenCalledWith({
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2)
      })
    })
  })

  describe('CSRF対策', () => {
    it('CSRF検証に失敗した場合、403エラーを返す', async () => {
      mocks.validateCsrfForPost.mockReturnValue(false)

      const handler = await getContactHandler()
      const request = createMockRequest({
        headers: {
          origin: 'http://malicious-site.com'
        },
        body: {
          name: 'テスト太郎',
          email: 'test@example.com',
          memberType: 'member',
          subject: 'inquiry',
          message: 'テストメッセージ'.repeat(2),
          privacy: true
        }
      })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data).toEqual({
        success: false,
        message: '不正なリクエストです'
      })
      expect(mocks.sendContactEmail).not.toHaveBeenCalled()
    })

    it('正しいOriginヘッダーの場合、CSRF検証を通過する', async () => {
      mocks.validateCsrfForPost.mockReturnValue(true)

      const handler = await getContactHandler()
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({
        headers: {
          origin: 'http://localhost:4321'
        },
        body: validBody
      })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      expect(response.status).toBe(200)
      expect(mocks.validateCsrfForPost).toHaveBeenCalledWith(request)
    })
  })

  describe('Content-Typeチェック', () => {
    it('Content-Typeがapplication/json以外の場合、400エラーを返す', async () => {
      const handler = await getContactHandler()
      const request = createMockRequest({
        headers: {
          'Content-Type': 'text/plain'
        },
        body: {
          name: 'テスト太郎',
          email: 'test@example.com',
          memberType: 'member',
          subject: 'inquiry',
          message: 'テストメッセージ',
          privacy: true
        }
      })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        message: 'リクエストのフォーマットが不正です'
      })
      expect(mocks.sendContactEmail).not.toHaveBeenCalled()
    })

    it('Content-Typeがapplication/jsonの場合、正常に処理される', async () => {
      const handler = await getContactHandler()
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({
        headers: {
          'Content-Type': 'application/json'
        },
        body: validBody
      })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      expect(response.status).toBe(200)
    })
  })

  describe('バリデーション', () => {
    it('バリデーションエラーの場合、422エラーとエラー詳細を返す', async () => {
      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['name'], message: 'お名前を入力してください' },
            { path: ['email'], message: '有効なメールアドレスを入力してください' }
          ]
        }
      })

      const handler = await getContactHandler()
      const request = createMockRequest({
        body: {
          name: '',
          email: 'invalid-email',
          memberType: 'member',
          subject: 'inquiry',
          message: 'テスト',
          privacy: true
        }
      })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data).toEqual({
        message: '入力内容に誤りがあります',
        errors: {
          name: 'お名前を入力してください',
          email: '有効なメールアドレスを入力してください'
        }
      })
      expect(mocks.sendContactEmail).not.toHaveBeenCalled()
    })

    it('全フィールドが正しい場合、バリデーションを通過する', async () => {
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const handler = await getContactHandler()
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.ContactFormSchema.safeParse).toHaveBeenCalledWith(validBody)
    })
  })

  describe('メール送信', () => {
    it('メール送信に成功した場合、200と成功メッセージを返す', async () => {
      mocks.sendContactEmail.mockResolvedValue()

      const handler = await getContactHandler()
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'お問い合わせを受け付けました。ご連絡ありがとうございます。',
        data: {
          message: 'メールを送信しました'
        }
      })
      expect(mocks.sendContactEmail).toHaveBeenCalledWith({
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2)
      })
    })

    it('メール送信に失敗した場合、500エラーを返す', async () => {
      mocks.sendContactEmail.mockRejectedValue(new Error('SMTP connection failed'))

      const handler = await getContactHandler()
      const validBody = {
        name: 'テスト太郎',
        email: 'test@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: 'これはテストメッセージです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください。'
      })
    })
  })

  describe('統合テスト', () => {
    it('会員からの一般的なお問い合わせが正常に処理される', async () => {
      const handler = await getContactHandler()
      const validBody = {
        name: '山田太郎',
        email: 'yamada@example.com',
        memberType: 'member' as const,
        subject: 'inquiry',
        message: '活動内容について詳しく知りたいです。'.repeat(2),
        privacy: true
      }
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.sendContactEmail).toHaveBeenCalledWith({
        name: '山田太郎',
        email: 'yamada@example.com',
        memberType: 'member',
        subject: 'inquiry',
        message: '活動内容について詳しく知りたいです。'.repeat(2)
      })
    })

    it('非会員からの入会希望が正常に処理される', async () => {
      const handler = await getContactHandler()
      const validBody = {
        name: '佐藤花子',
        email: 'sato@example.com',
        memberType: 'non-member' as const,
        subject: 'membership',
        message: '入会を希望しています。手続きについて教えてください。'.repeat(1),
        privacy: true
      }
      const request = createMockRequest({ body: validBody })
      const context = createMockContext(request)

      mocks.ContactFormSchema.safeParse.mockReturnValue({
        success: true,
        data: validBody
      })

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mocks.sendContactEmail).toHaveBeenCalledWith({
        name: '佐藤花子',
        email: 'sato@example.com',
        memberType: 'non-member',
        subject: 'membership',
        message: '入会を希望しています。手続きについて教えてください。'
      })
    })
  })

  describe('エラーハンドリング', () => {
    it('予期しないエラーが発生した場合、500エラーを返す', async () => {
      // request.json() がエラーを投げる状況をシミュレート
      const handler = await getContactHandler()
      const request = new Request('http://localhost:4321/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:4321'
        },
        body: 'invalid json{'
      })
      const context = createMockContext(request)

      const response = await handler(context)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        message: 'サーバーエラーが発生しました'
      })
    })
  })
})
