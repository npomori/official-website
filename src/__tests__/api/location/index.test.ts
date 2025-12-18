import LocationDB from '@/server/db/location'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// LocationDB をモック
vi.mock('@/server/db/location', () => ({
  default: {
    findAll: vi.fn(),
    findByType: vi.fn(),
    findWithDetails: vi.fn(),
    getLocationById: vi.fn()
  }
}))

describe('GET /api/location (公開活動地一覧API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createMockRequest = (searchParams?: Record<string, string>): Request => {
    const url = new URL('http://localhost:3000/api/location')
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    return new Request(url, { method: 'GET' })
  }

  it('全ての活動地を取得できる', async () => {
    const mockLocations = [
      {
        id: 'location-1',
        name: '活動地1',
        position: [35.0, 135.0],
        type: 'regular',
        status: 'published'
      },
      {
        id: 'location-2',
        name: '活動地2',
        position: [35.1, 135.1],
        type: 'meeting',
        status: 'published'
      }
    ]

    vi.mocked(LocationDB.findAll).mockResolvedValue(mockLocations)

    const { GET } = await import('@/pages/api/location/index')
    const request = createMockRequest()
    const response = await GET({ url: new URL(request.url), request } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.locations).toEqual(mockLocations)
    expect(LocationDB.findAll).toHaveBeenCalledOnce()
  })

  it('type パラメータで活動地をフィルタリングできる', async () => {
    const mockLocations = [
      {
        id: 'location-1',
        name: '定期活動地',
        position: [35.0, 135.0],
        type: 'regular',
        status: 'published'
      }
    ]

    vi.mocked(LocationDB.findByType).mockResolvedValue(mockLocations)

    const { GET } = await import('@/pages/api/location/index')
    const request = createMockRequest({ type: 'regular' })
    const response = await GET({ url: new URL(request.url), request } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.locations).toEqual(mockLocations)
    expect(LocationDB.findByType).toHaveBeenCalledWith('regular')
  })

  it('hasDetail=true パラメータで詳細情報ありの活動地のみ取得できる', async () => {
    const mockLocations = [
      {
        id: 'location-1',
        name: '詳細情報ありの活動地',
        position: [35.0, 135.0],
        type: 'regular',
        hasDetail: true,
        status: 'published'
      }
    ]

    vi.mocked(LocationDB.findWithDetails).mockResolvedValue(mockLocations)

    const { GET } = await import('@/pages/api/location/index')
    const request = createMockRequest({ hasDetail: 'true' })
    const response = await GET({ url: new URL(request.url), request } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.locations).toEqual(mockLocations)
    expect(LocationDB.findWithDetails).toHaveBeenCalledOnce()
  })

  it('データベースエラー時に500エラーを返す', async () => {
    vi.mocked(LocationDB.findAll).mockRejectedValue(new Error('Database error'))

    const { GET } = await import('@/pages/api/location/index')
    const request = createMockRequest()
    const response = await GET({ url: new URL(request.url), request } as any)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地データの取得に失敗しました')
  })
})

describe('GET /api/location/[id] (公開活動地詳細API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('指定されたIDの活動地を取得できる', async () => {
    const mockLocation = {
      id: 'location-1',
      name: '活動地1',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published',
      activities: '毎週日曜日に活動しています',
      address: '大阪府大阪市'
    }

    vi.mocked(LocationDB.getLocationById).mockResolvedValue(mockLocation)

    const { GET } = await import('@/pages/api/location/[id]')
    const response = await GET({ params: { id: 'location-1' } } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockLocation)
    expect(LocationDB.getLocationById).toHaveBeenCalledWith('location-1')
  })

  it('IDが指定されていない場合は400エラーを返す', async () => {
    const { GET } = await import('@/pages/api/location/[id]')
    const response = await GET({ params: {} } as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地IDが指定されていません')
  })

  it('指定されたIDの活動地が存在しない場合は404エラーを返す', async () => {
    vi.mocked(LocationDB.getLocationById).mockResolvedValue(null)

    const { GET } = await import('@/pages/api/location/[id]')
    const response = await GET({ params: { id: 'non-existent' } } as any)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地が見つかりません')
  })

  it('データベースエラー時に500エラーを返す', async () => {
    vi.mocked(LocationDB.getLocationById).mockRejectedValue(new Error('Database error'))

    const { GET } = await import('@/pages/api/location/[id]')
    const response = await GET({ params: { id: 'location-1' } } as any)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地データの取得に失敗しました')
  })
})
