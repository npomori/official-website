import LocationDB from '@/server/db/location'
import FileUploader from '@/server/utils/file-upload'
import { processImageWithResize, processImagesWithResize } from '@/server/utils/image-processor'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モジュールをモック
vi.mock('@/server/db/location', () => ({
  default: {
    findAllAdmin: vi.fn(),
    getLocationByIdForAdmin: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('@/server/utils/file-upload', () => {
  const MockFileUploader = vi.fn(function (this: any) {
    this.validateFileCount = vi.fn().mockReturnValue(true)
    this.validateFileSize = vi.fn().mockReturnValue(true)
    this.uploadFiles = vi
      .fn()
      .mockResolvedValue([{ name: 'test.pdf', filename: 'test-123.pdf', size: 1024 }])
    this.deleteFiles = vi.fn().mockResolvedValue(undefined)
  })

  return {
    default: MockFileUploader
  }
})

vi.mock('@/server/utils/image-processor', () => ({
  processImageWithResize: vi.fn(),
  processImagesWithResize: vi.fn()
}))

vi.mock('@/config/config.json', () => ({
  default: {
    upload: {
      location: {
        maxFileSize: 5 * 1024 * 1024,
        maxFiles: 10,
        maxSize: {
          width: 1920,
          height: 1080
        },
        quality: 85,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
      }
    }
  }
}))

vi.mock('@/types/config', () => ({
  getLocationUploadConfig: vi.fn(() => ({
    directory: 'public/uploads/locations',
    url: '/uploads/locations',
    subDirectories: {
      gallery: 'gallery',
      attachments: 'attachments'
    }
  }))
}))

describe('GET /api/admin/location (管理者用活動地一覧API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('全ての活動地（下書きを含む）を取得できる', async () => {
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
        name: '活動地2（下書き）',
        position: [35.1, 135.1],
        type: 'meeting',
        status: 'draft'
      }
    ]

    vi.mocked(LocationDB.findAllAdmin).mockResolvedValue(mockLocations)

    const { GET } = await import('@/pages/api/admin/location/index')
    const response = await GET({} as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.locations).toEqual(mockLocations)
    expect(LocationDB.findAllAdmin).toHaveBeenCalledOnce()
  })

  it('データベースエラー時に500エラーを返す', async () => {
    vi.mocked(LocationDB.findAllAdmin).mockRejectedValue(new Error('Database error'))

    const { GET } = await import('@/pages/api/admin/location/index')
    const response = await GET({} as any)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地データの取得に失敗しました')
  })
})

describe('POST /api/admin/location (管理者用活動地作成API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(processImageWithResize).mockResolvedValue({
      filename: 'main-image-123.jpg',
      name: 'main-image.jpg',
      size: 102400
    })
    vi.mocked(processImagesWithResize).mockResolvedValue({
      succeeded: [
        { filename: 'gallery-1-123.jpg', name: 'gallery-1.jpg', size: 51200 },
        { filename: 'gallery-2-123.jpg', name: 'gallery-2.jpg', size: 61440 }
      ],
      failed: []
    })
  })

  const createMockFormData = (overrides?: Record<string, any>): FormData => {
    const formData = new FormData()
    formData.append('id', overrides?.id || 'test-location-1')
    formData.append('name', overrides?.name || 'テスト活動地')
    formData.append('position', JSON.stringify(overrides?.position || [35.0, 135.0]))
    formData.append('type', overrides?.type || 'regular')
    formData.append('hasDetail', String(overrides?.hasDetail ?? false))
    formData.append('isDraft', String(overrides?.isDraft ?? false))

    if (overrides?.activities) {
      formData.append('activities', overrides.activities)
    }
    if (overrides?.address) {
      formData.append('address', overrides.address)
    }

    return formData
  }

  it('活動地を作成できる', async () => {
    const mockCreatedLocation = {
      id: 'test-location-1',
      name: 'テスト活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published'
    }

    vi.mocked(LocationDB.create).mockResolvedValue(mockCreatedLocation)

    const formData = createMockFormData()
    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { POST } = await import('@/pages/api/admin/location/index')
    const response = await POST({
      request: mockRequest,
      locals: { user: { id: 'user-1' } }
    } as any)

    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockCreatedLocation)
    expect(LocationDB.create).toHaveBeenCalled()
  })

  it('メイン画像付きで活動地を作成できる', async () => {
    const mockCreatedLocation = {
      id: 'test-location-1',
      name: 'テスト活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published',
      image: '/uploads/locations/main-image-123.jpg'
    }

    vi.mocked(LocationDB.create).mockResolvedValue(mockCreatedLocation)

    const formData = createMockFormData()
    const imageFile = new File(['image content'], 'test-image.jpg', { type: 'image/jpeg' })
    formData.append('image', imageFile)

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { POST } = await import('@/pages/api/admin/location/index')
    const response = await POST({
      request: mockRequest,
      locals: { user: { id: 'user-1' } }
    } as any)

    expect(response.status).toBe(201)
    expect(processImageWithResize).toHaveBeenCalled()
  })

  it('ギャラリー画像付きで活動地を作成できる', async () => {
    const mockCreatedLocation = {
      id: 'test-location-1',
      name: 'テスト活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published',
      gallery: [
        { filename: 'gallery-1-123.jpg', name: 'gallery-1.jpg', size: 51200 },
        { filename: 'gallery-2-123.jpg', name: 'gallery-2.jpg', size: 61440 }
      ]
    }

    vi.mocked(LocationDB.create).mockResolvedValue(mockCreatedLocation)

    const formData = createMockFormData()
    const galleryFile1 = new File(['image1'], 'gallery-1.jpg', { type: 'image/jpeg' })
    const galleryFile2 = new File(['image2'], 'gallery-2.jpg', { type: 'image/jpeg' })
    formData.append('gallery', galleryFile1)
    formData.append('gallery', galleryFile2)
    formData.append('gallery_caption_0', 'キャプション1')
    formData.append('gallery_caption_1', 'キャプション2')

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { POST } = await import('@/pages/api/admin/location/index')
    const response = await POST({
      request: mockRequest,
      locals: { user: { id: 'user-1' } }
    } as any)

    expect(response.status).toBe(201)
    expect(processImagesWithResize).toHaveBeenCalled()
  })

  it('下書きとして活動地を作成できる', async () => {
    const mockCreatedLocation = {
      id: 'test-location-1',
      name: 'テスト活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'draft'
    }

    vi.mocked(LocationDB.create).mockResolvedValue(mockCreatedLocation)

    const formData = createMockFormData({ isDraft: true })
    const mockRequest = {
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { POST } = await import('@/pages/api/admin/location/index')
    const response = await POST({
      request: mockRequest,
      locals: { user: { id: 'user-1' } }
    } as any)

    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.success).toBe(true)
  })
})

describe('GET /api/admin/location/[id] (管理者用活動地詳細API)', () => {
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
      activities: '毎週日曜日に活動しています'
    }

    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(mockLocation)

    const { GET } = await import('@/pages/api/admin/location/[id]')
    const response = await GET({ params: { id: 'location-1' } } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockLocation)
    expect(LocationDB.getLocationByIdForAdmin).toHaveBeenCalledWith('location-1')
  })

  it('IDが指定されていない場合は400エラーを返す', async () => {
    const { GET } = await import('@/pages/api/admin/location/[id]')
    const response = await GET({ params: {} } as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('無効なIDです')
  })

  it('活動地が存在しない場合は404エラーを返す', async () => {
    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(null)

    const { GET } = await import('@/pages/api/admin/location/[id]')
    const response = await GET({ params: { id: 'non-existent' } } as any)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地が見つかりません')
  })
})

describe('PUT /api/admin/location/[id] (管理者用活動地更新API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(processImageWithResize).mockResolvedValue({
      filename: 'updated-image-123.jpg',
      name: 'updated-image.jpg',
      size: 102400
    })
    vi.mocked(processImagesWithResize).mockResolvedValue({
      succeeded: [],
      failed: []
    })
  })

  const createMockFormData = (overrides?: Record<string, any>): FormData => {
    const formData = new FormData()
    formData.append('name', overrides?.name || 'テスト活動地')
    formData.append('position', JSON.stringify(overrides?.position || [35.0, 135.0]))
    formData.append('type', overrides?.type || 'regular')
    formData.append('hasDetail', String(overrides?.hasDetail ?? false))
    formData.append('isDraft', String(overrides?.isDraft ?? false))

    return formData
  }

  it('活動地を更新できる', async () => {
    const mockExistingLocation = {
      id: 'location-1',
      name: '既存の活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published'
    }

    const mockUpdatedLocation = {
      ...mockExistingLocation,
      name: '更新後の活動地'
    }

    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(mockExistingLocation)
    vi.mocked(LocationDB.update).mockResolvedValue(mockUpdatedLocation)

    const formData = createMockFormData({ name: '更新後の活動地' })
    const mockRequest = {
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { PUT } = await import('@/pages/api/admin/location/[id]')
    const response = await PUT({
      params: { id: 'location-1' },
      request: mockRequest
    } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockUpdatedLocation)
    expect(LocationDB.update).toHaveBeenCalledWith('location-1', expect.any(Object))
  })

  it('IDが指定されていない場合は400エラーを返す', async () => {
    const { PUT } = await import('@/pages/api/admin/location/[id]')
    const response = await PUT({ params: {}, request: {} } as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('無効なIDです')
  })

  it('Content-Typeが正しくない場合は415エラーを返す', async () => {
    const mockRequest = {
      headers: new Headers({ 'content-type': 'application/json' })
    } as any

    const { PUT } = await import('@/pages/api/admin/location/[id]')
    const response = await PUT({
      params: { id: 'location-1' },
      request: mockRequest
    } as any)

    expect(response.status).toBe(415)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('multipart/form-data で送信してください')
  })

  it('活動地が存在しない場合は404エラーを返す', async () => {
    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(null)

    const formData = createMockFormData()
    const mockRequest = {
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn().mockResolvedValue(formData)
    } as any

    const { PUT } = await import('@/pages/api/admin/location/[id]')
    const response = await PUT({
      params: { id: 'non-existent' },
      request: mockRequest
    } as any)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地が見つかりません')
  })
})

describe('DELETE /api/admin/location/[id] (管理者用活動地削除API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('活動地を削除できる', async () => {
    const mockLocation = {
      id: 'location-1',
      name: '削除対象の活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published'
    }

    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(mockLocation)
    vi.mocked(LocationDB.delete).mockResolvedValue(undefined)

    const { DELETE } = await import('@/pages/api/admin/location/[id]')
    const response = await DELETE({ params: { id: 'location-1' } } as any)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toBe('活動地を削除しました')
    expect(LocationDB.delete).toHaveBeenCalledWith('location-1')
  })

  it('IDが指定されていない場合は400エラーを返す', async () => {
    const { DELETE } = await import('@/pages/api/admin/location/[id]')
    const response = await DELETE({ params: {} } as any)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('無効なIDです')
  })

  it('活動地が存在しない場合は404エラーを返す', async () => {
    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(null)

    const { DELETE } = await import('@/pages/api/admin/location/[id]')
    const response = await DELETE({ params: { id: 'non-existent' } } as any)

    expect(response.status).toBe(404)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地が見つかりません')
  })

  it('データベースエラー時に500エラーを返す', async () => {
    const mockLocation = {
      id: 'location-1',
      name: '削除対象の活動地',
      position: [35.0, 135.0],
      type: 'regular',
      status: 'published'
    }

    vi.mocked(LocationDB.getLocationByIdForAdmin).mockResolvedValue(mockLocation)
    vi.mocked(LocationDB.delete).mockRejectedValue(new Error('Database error'))

    const { DELETE } = await import('@/pages/api/admin/location/[id]')
    const response = await DELETE({ params: { id: 'location-1' } } as any)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('活動地の削除に失敗しました')
  })
})
