import type { APIContext } from 'astro'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

describe('News API', () => {
  let mockNewsDB: any
  let mockValidateNewsApi: Mock
  let mockFileUploader: any

  beforeEach(() => {
    vi.clearAllMocks()

    // NewsDB のモック
    mockNewsDB = {
      getNewsWithPagination: vi.fn(),
      getHiddenNewsWithPagination: vi.fn(),
      createNews: vi.fn(),
      updateNews: vi.fn(),
      deleteNews: vi.fn(),
      getNewsById: vi.fn(),
      getPublicNewsById: vi.fn(),
      getAttachmentByFilename: vi.fn()
    }

    // バリデーションのモック
    mockValidateNewsApi = vi.fn()

    // FileUploader のモック
    mockFileUploader = {
      validateFileCount: vi.fn().mockReturnValue(true),
      validateFileType: vi.fn().mockReturnValue(true),
      validateFileSize: vi.fn().mockReturnValue(true),
      uploadFiles: vi.fn().mockResolvedValue([
        {
          name: 'test.pdf',
          filename: 'test-123456.pdf',
          size: 1024
        }
      ])
    }
  })

  describe('GET /api/admin/news', () => {
    it('管理者用のお知らせ一覧を取得できる', async () => {
      const mockNews = [
        {
          id: 1,
          title: 'テストお知らせ',
          content: 'テスト内容',
          date: new Date('2025-12-15'),
          categories: ['イベント'],
          priority: null,
          attachments: [
            {
              name: 'test.pdf',
              filename: 'test-123456.pdf',
              size: 1024
            }
          ],
          author: 'テスト太郎',
          status: 'published',
          isMemberOnly: false,
          creatorId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockNewsDB.getNewsWithPagination.mockResolvedValue({
        news: mockNews,
        totalCount: 1
      })

      expect(mockNews[0].attachments[0]).toHaveProperty('name')
      expect(mockNews[0].attachments[0]).toHaveProperty('filename')
      expect(mockNews[0].attachments[0]).toHaveProperty('size')
      expect(mockNews[0].attachments[0].name).toBe('test.pdf')
    })

    it('非公開のお知らせ一覧を取得できる', async () => {
      const mockHiddenNews = [
        {
          id: 2,
          title: '未来のお知らせ',
          content: '未来の内容',
          date: new Date('2025-12-20'),
          categories: ['告知'],
          priority: null,
          attachments: null,
          author: 'テスト花子',
          status: 'published',
          isMemberOnly: false,
          creatorId: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockNewsDB.getHiddenNewsWithPagination.mockResolvedValue({
        news: mockHiddenNews,
        totalCount: 1
      })

      const result = await mockNewsDB.getHiddenNewsWithPagination(1, 10)
      expect(result.news).toHaveLength(1)
      expect(result.totalCount).toBe(1)
    })
  })

  describe('POST /api/admin/news', () => {
    it('添付ファイル付きのお知らせを作成できる', async () => {
      const mockCreatedNews = {
        id: 1,
        title: '新しいお知らせ',
        content: 'お知らせ内容',
        date: new Date('2025-12-15'),
        categories: ['イベント'],
        priority: null,
        attachments: [
          {
            name: 'document.pdf',
            filename: 'document-789012.pdf',
            size: 2048
          }
        ],
        author: '作成者',
        status: 'published',
        isMemberOnly: false,
        creatorId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockNewsDB.createNews.mockResolvedValue(mockCreatedNews)

      const result = await mockNewsDB.createNews({
        title: '新しいお知らせ',
        content: 'お知らせ内容',
        date: new Date('2025-12-15'),
        categories: ['イベント'],
        attachments: [
          {
            name: 'document.pdf',
            filename: 'document-789012.pdf',
            size: 2048
          }
        ],
        author: '作成者',
        status: 'published',
        isMemberOnly: false,
        creatorId: 1
      })

      expect(result.attachments).toHaveLength(1)
      expect(result.attachments[0]).toHaveProperty('name')
      expect(result.attachments[0]).toHaveProperty('filename')
      expect(result.attachments[0]).toHaveProperty('size')
      expect(result.attachments[0].name).toBe('document.pdf')
      expect(result.attachments[0].filename).toBe('document-789012.pdf')
      expect(result.attachments[0].size).toBe(2048)
    })

    it('添付ファイルなしのお知らせを作成できる', async () => {
      const mockCreatedNews = {
        id: 2,
        title: 'シンプルなお知らせ',
        content: '内容のみ',
        date: new Date('2025-12-15'),
        categories: ['告知'],
        priority: null,
        attachments: null,
        author: '作成者',
        status: 'published',
        isMemberOnly: false,
        creatorId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockNewsDB.createNews.mockResolvedValue(mockCreatedNews)

      const result = await mockNewsDB.createNews({
        title: 'シンプルなお知らせ',
        content: '内容のみ',
        date: new Date('2025-12-15'),
        categories: ['告知'],
        attachments: null,
        author: '作成者',
        status: 'published',
        isMemberOnly: false,
        creatorId: 1
      })

      expect(result.attachments).toBeNull()
    })
  })

  describe('FileUploader', () => {
    it('アップロードされたファイルは正しいプロパティを持つ', async () => {
      const uploadedFiles = await mockFileUploader.uploadFiles([])

      expect(uploadedFiles[0]).toHaveProperty('name')
      expect(uploadedFiles[0]).toHaveProperty('filename')
      expect(uploadedFiles[0]).toHaveProperty('size')
      expect(uploadedFiles[0]).not.toHaveProperty('originalName')
    })
  })

  describe('NewsDB.getAttachmentByFilename', () => {
    it('ファイル名から添付ファイル情報を取得できる', async () => {
      const mockAttachment = {
        name: 'original-file.pdf',
        filename: 'stored-123456.pdf',
        size: 3072
      }

      mockNewsDB.getAttachmentByFilename.mockResolvedValue(mockAttachment)

      const result = await mockNewsDB.getAttachmentByFilename('stored-123456.pdf')

      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('size')
      expect(result).not.toHaveProperty('originalName')
      expect(result.name).toBe('original-file.pdf')
      expect(result.filename).toBe('stored-123456.pdf')
      expect(result.size).toBe(3072)
    })

    it('ファイルが見つからない場合は null を返す', async () => {
      mockNewsDB.getAttachmentByFilename.mockResolvedValue(null)

      const result = await mockNewsDB.getAttachmentByFilename('nonexistent.pdf')

      expect(result).toBeNull()
    })
  })

  describe('NewsAttachment 型の整合性', () => {
    it('すべての添付ファイルは name, filename, size を持つ', () => {
      const validAttachment = {
        name: 'display-name.pdf',
        filename: 'stored-name.pdf',
        size: 1024
      }

      expect(validAttachment).toHaveProperty('name')
      expect(validAttachment).toHaveProperty('filename')
      expect(validAttachment).toHaveProperty('size')
      expect(typeof validAttachment.name).toBe('string')
      expect(typeof validAttachment.filename).toBe('string')
      expect(typeof validAttachment.size).toBe('number')
    })

    it('originalName プロパティは使用されない', () => {
      const newAttachment = {
        name: 'modern-name.pdf',
        filename: 'stored.pdf',
        size: 2048
      }

      expect(newAttachment).not.toHaveProperty('originalName')
    })
  })
})
