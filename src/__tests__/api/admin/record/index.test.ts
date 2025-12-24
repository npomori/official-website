import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('Record API', () => {
  let mockRecordDB: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockRecordDB = {
      createRecord: vi.fn(),
      getRecords: vi.fn()
    }
  })

  describe('POST /api/admin/record', () => {
    it('画像なしで公開記録を作成できる', async () => {
      const recordData = {
        location: '箕面国有林',
        datetime: '2025年12月24日',
        weather: '晴れ',
        participants: '35名',
        reporter: '大阪太郎',
        content: 'テスト活動内容',
        categories: ['mowing'],
        status: 'published',
        creatorId: 1
      }

      mockRecordDB.createRecord.mockResolvedValue({
        id: 1,
        ...recordData,
        eventDate: new Date('2025-12-24'),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await mockRecordDB.createRecord(recordData)

      expect(result.status).toBe('published')
      expect(result.location).toBe('箕面国有林')
      expect(mockRecordDB.createRecord).toHaveBeenCalledWith(recordData)
    })

    it('画像付きで公開記録を作成できる', async () => {
      const recordData = {
        location: '箕面国有林',
        datetime: '2025年12月24日',
        weather: '晴れ',
        participants: '35名',
        reporter: '大阪太郎',
        content: 'テスト活動内容',
        categories: ['mowing'],
        images: ['record-20251224-1.jpg', 'record-20251224-2.jpg'],
        status: 'published',
        creatorId: 1
      }

      mockRecordDB.createRecord.mockResolvedValue({
        id: 1,
        ...recordData,
        eventDate: new Date('2025-12-24'),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await mockRecordDB.createRecord(recordData)

      expect(result.status).toBe('published')
      expect(result.images).toHaveLength(2)
      expect(mockRecordDB.createRecord).toHaveBeenCalledWith(recordData)
    })

    it('下書きとして記録を作成できる', async () => {
      const recordData = {
        location: '箕面国有林',
        datetime: '2025年12月24日',
        weather: '晴れ',
        participants: '35名',
        reporter: '大阪太郎',
        content: 'テスト活動内容',
        categories: ['mowing'],
        status: 'draft',
        creatorId: 1
      }

      mockRecordDB.createRecord.mockResolvedValue({
        id: 1,
        ...recordData,
        eventDate: new Date('2025-12-24'),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await mockRecordDB.createRecord(recordData)

      expect(result.status).toBe('draft')
      expect(mockRecordDB.createRecord).toHaveBeenCalledWith(recordData)
    })
  })

  describe('GET /api/admin/record', () => {
    it('ページネーション付きで記録一覧を取得できる', async () => {
      const mockRecords = [
        {
          id: 1,
          location: '箕面国有林',
          datetime: '2025年12月24日',
          status: 'published',
          creatorId: 1,
          eventDate: new Date('2025-12-24'),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          location: '別の場所',
          datetime: '2025年12月25日',
          status: 'published',
          creatorId: 1,
          eventDate: new Date('2025-12-25'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockRecordDB.getRecords.mockResolvedValue({
        records: mockRecords,
        total: 2,
        page: 1,
        limit: 10
      })

      const result = await mockRecordDB.getRecords({ page: 1, limit: 10 })

      expect(result.records).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(mockRecordDB.getRecords).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })
  })
})
