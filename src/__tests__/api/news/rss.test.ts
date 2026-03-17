import { beforeEach, describe, expect, it, vi } from 'vitest'

// モックをホイストして定義
const mocks = vi.hoisted(() => {
  return {
    config: {
      site: {
        title: 'テストサイト',
        organization: {
          url: 'https://www.example.com'
        },
        head: {
          defaultDescription: 'テストサイトの説明'
        }
      },
      content: {
        news: {
          rss: {
            enabled: true,
            maxItems: 20,
            descriptionLength: 200
          }
        }
      }
    },
    NewsDB: {
      getNewsWithPagination: vi.fn()
    }
  }
})

// モジュールをモック
vi.mock('@/types/config', () => ({
  getConfig: () => mocks.config
}))

vi.mock('@/server/db', () => ({
  NewsDB: mocks.NewsDB
}))

beforeEach(() => {
  vi.clearAllMocks()

  // デフォルトの動作を設定
  mocks.config.content.news.rss.enabled = true
  mocks.config.content.news.rss.maxItems = 20
  mocks.config.content.news.rss.descriptionLength = 200
})

const getRssHandler = async () => {
  // モジュールをリロード（モックが反映されるように）
  vi.resetModules()
  const mod = await import('@/pages/news/rss.xml.ts')
  return mod.GET
}

const createMockContext = () => ({
  request: new Request('http://localhost:4321/news/rss.xml'),
  url: new URL('http://localhost:4321/news/rss.xml'),
  params: {},
  props: {},
  redirect: vi.fn(),
  locals: {}
})

describe('GET /news/rss.xml', () => {
  describe('RSS Configuration Tests', () => {
    it('RSS無効時に404を返却する', async () => {
      mocks.config.content.news.rss.enabled = false

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.status).toBe(404)
      expect(response.headers.get('Content-Type')).toBe('application/json')

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('RSS配信は現在無効になっています')
    })

    it('RSS有効時に200とXMLを返却する', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テストお知らせ',
            content: 'テスト内容です。',
            date: new Date('2026-03-15T10:00:00+09:00'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/rss+xml; charset=utf-8')

      const xml = await response.text()
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<rss version="2.0">')
    })

    it('Cache-Controlヘッダーが設定されている', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [],
        totalCount: 0
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('Filtering Logic Tests', () => {
    it('getNewsWithPagination が正しいパラメータで呼ばれる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [],
        totalCount: 0
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      await handler(context as any)

      expect(mocks.NewsDB.getNewsWithPagination).toHaveBeenCalledWith(
        1, // page
        20, // maxItems
        false, // hasAdminRole
        false // isLoggedIn
      )
    })

    it('会員限定記事が除外される', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: '公開記事',
            content: '公開内容',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          },
          {
            id: 2,
            title: '会員限定記事',
            content: '会員限定内容',
            date: new Date('2026-03-15'),
            isMemberOnly: true,
            author: 'テスト花子'
          }
        ],
        totalCount: 2
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()
      expect(xml).toContain('公開記事')
      expect(xml).not.toContain('会員限定記事')
    })

    it('公開済み・非会員限定・本日以前の記事のみが含まれる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: '公開記事1',
            content: '内容1',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          },
          {
            id: 2,
            title: '公開記事2',
            content: '内容2',
            date: new Date('2026-03-14'),
            isMemberOnly: false,
            author: 'テスト花子'
          }
        ],
        totalCount: 2
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()
      expect(xml).toContain('公開記事1')
      expect(xml).toContain('公開記事2')
    })
  })

  describe('XML Structure Tests', () => {
    it('有効なRSS 2.0構造を持つ', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: 'テスト内容',
            date: new Date('2026-03-15T10:00:00+09:00'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      // XML宣言
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      // RSS 2.0宣言
      expect(xml).toContain('<rss version="2.0">')
      // channel要素
      expect(xml).toContain('<channel>')
      expect(xml).toContain('</channel>')
      expect(xml).toContain('</rss>')
    })

    it('channel要素に必須項目が含まれる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [],
        totalCount: 0
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain('<title>テストサイト</title>')
      expect(xml).toContain('<link>https://www.example.com</link>')
      expect(xml).toContain('<description>テストサイトの説明</description>')
      expect(xml).toContain('<language>ja</language>')
      expect(xml).toContain('<lastBuildDate>')
    })

    it('item要素に必須項目が含まれる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 123,
            title: 'テスト記事',
            content: 'テスト内容です。',
            date: new Date('2026-03-15T10:00:00+09:00'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain('<item>')
      expect(xml).toContain('<title>テスト記事</title>')
      expect(xml).toContain('<link>https://www.example.com/news/123</link>')
      expect(xml).toContain('<description><![CDATA[')
      expect(xml).toContain('<pubDate>')
      expect(xml).toContain('<guid isPermaLink="true">https://www.example.com/news/123</guid>')
      expect(xml).toContain('</item>')
    })
  })

  describe('Content Escaping Tests', () => {
    it('タイトルの特殊文字が正しくエスケープされる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト & <script>alert("XSS")</script> "引用符" \'アポストロフィ\'',
            content: 'テスト内容',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain('&amp;')
      expect(xml).toContain('&lt;')
      expect(xml).toContain('&gt;')
      expect(xml).toContain('&quot;')
      expect(xml).toContain('&apos;')
      expect(xml).not.toContain('<script>')
    })

    it('HTMLタグが除去される', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: '<p>これは<strong>テスト</strong>です。</p><div>段落です。</div>',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain('<![CDATA[これはテストです。段落です。]]>')
      expect(xml).not.toContain('<p>')
      expect(xml).not.toContain('<strong>')
      expect(xml).not.toContain('<div>')
    })

    it('HTML エンティティがデコードされる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: 'テスト&nbsp;&amp;&lt;&gt;&quot;&#39;内容',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      // エンティティがデコードされて通常の文字になる
      expect(xml).toContain('テスト &<>"\'内容')
    })
  })

  describe('Date Formatting Tests', () => {
    it('RFC 822形式で日付が出力される', async () => {
      // 2026-03-15 10:00:00 JST
      const testDate = new Date('2026-03-15T10:00:00+09:00')

      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: 'テスト内容',
            date: testDate,
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      // RFC 822形式: Day, DD Mon YYYY HH:MM:SS +ZZZZ
      // 2026-03-15は日曜日
      expect(xml).toMatch(/<pubDate>Sun, 15 Mar 2026 10:00:00 \+\d{4}<\/pubDate>/)
    })

    it('lastBuildDateが含まれる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [],
        totalCount: 0
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toMatch(
        /<lastBuildDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}<\/lastBuildDate>/
      )
    })
  })

  describe('Limit & Truncation Tests', () => {
    it('maxItems の設定が反映される', async () => {
      mocks.config.content.news.rss.maxItems = 5

      const handler = await getRssHandler()
      const context = createMockContext()
      await handler(context as any)

      expect(mocks.NewsDB.getNewsWithPagination).toHaveBeenCalledWith(
        1,
        5, // maxItems
        false,
        false
      )
    })

    it('descriptionLength の設定が反映される', async () => {
      mocks.config.content.news.rss.descriptionLength = 50

      const longContent = 'あ'.repeat(100)
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: longContent,
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      // 50文字 + "..." = 53文字
      const expectedContent = 'あ'.repeat(50) + '...'
      expect(xml).toContain(expectedContent)
    })

    it('短いcontentは"..."なしで出力される', async () => {
      mocks.config.content.news.rss.descriptionLength = 200

      const shortContent = 'これは短い内容です。'
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: shortContent,
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain(shortContent)
      expect(xml).not.toContain(shortContent + '...')
    })

    it('連続する空白が1つにまとめられる', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: 'これは    複数の   空白が    含まれる    テキストです。',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      expect(xml).toContain('これは 複数の 空白が 含まれる テキストです。')
    })
  })

  describe('Edge Cases Tests', () => {
    it('お知らせが0件の場合でもエラーが発生しない', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [],
        totalCount: 0
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.status).toBe(200)

      const xml = await response.text()
      expect(xml).toContain('<rss version="2.0">')
      expect(xml).toContain('<channel>')
      expect(xml).not.toContain('<item>')
    })

    it('空のcontent/titleでもエラーが発生しない', async () => {
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: '',
            content: '',
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.status).toBe(200)

      const xml = await response.text()
      expect(xml).toContain('<item>')
      expect(xml).toContain('<title></title>')
      expect(xml).toContain('<description><![CDATA[]]></description>')
    })

    it('非常に長いcontentが正しく切り詰められる', async () => {
      const veryLongContent = 'あ'.repeat(1000)
      mocks.NewsDB.getNewsWithPagination.mockResolvedValue({
        news: [
          {
            id: 1,
            title: 'テスト記事',
            content: veryLongContent,
            date: new Date('2026-03-15'),
            isMemberOnly: false,
            author: 'テスト太郎'
          }
        ],
        totalCount: 1
      })

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      const xml = await response.text()

      // 200文字 + "..." = 203文字
      const expectedContent = 'あ'.repeat(200) + '...'
      expect(xml).toContain(expectedContent)
      expect(xml).not.toContain('あ'.repeat(1000))
    })
  })

  describe('Error Handling Tests', () => {
    it('DBエラー時に500を返却する', async () => {
      mocks.NewsDB.getNewsWithPagination.mockRejectedValue(new Error('Database error'))

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const handler = await getRssHandler()
      const context = createMockContext()
      const response = await handler(context as any)

      expect(response.status).toBe(500)
      expect(response.headers.get('Content-Type')).toBe('application/json')

      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.message).toContain('RSSフィードの生成に失敗しました')

      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('console.errorが呼ばれる', async () => {
      const testError = new Error('Test error')
      mocks.NewsDB.getNewsWithPagination.mockRejectedValue(testError)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const handler = await getRssHandler()
      const context = createMockContext()
      await handler(context as any)

      expect(consoleErrorSpy).toHaveBeenCalledWith('RSS Feed Generation Error:', testError)

      consoleErrorSpy.mockRestore()
    })
  })
})
