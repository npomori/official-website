import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const uploaderInstance = {
    validateFileType: vi.fn<(file: File, allowed: string[]) => boolean>(),
    validateFileSize: vi.fn<(file: File, maxSize: number) => boolean>(),
    uploadFile: vi.fn<(file: File) => Promise<{ filename: string; originalName: string }>>(),
    deleteFile: vi.fn<(filename: string) => Promise<boolean>>()
  }

  const uploadConfig = {
    enabled: true,
    url: '/uploads/articles',
    directory: 'public/uploads/articles',
    maxFiles: 30,
    maxFileSize: 10_485_760,
    allowedTypes: ['image/jpeg', 'image/png'],
    maxSize: { width: 1920, height: 1920 },
    quality: 85
  }

  return {
    collectArticleImageNames: vi.fn<(content: string) => string[]>(),
    deleteUnusedArticleImagesByNames:
      vi.fn<
        (
          oldNames: string[] | null | undefined,
          newNames: string[] | null | undefined
        ) => Promise<void>
      >(),
    articleDb: {
      createArticle: vi.fn<(data: Record<string, unknown>) => Promise<unknown>>(),
      getArticleByIdAdmin: vi.fn<(id: number) => Promise<unknown>>(),
      updateArticle: vi.fn<(id: number, data: Record<string, unknown>) => Promise<unknown>>()
    },
    uploaderInstance,
    uploaderConstructor: vi.fn(() => uploaderInstance),
    uploadConfig,
    getArticleUploadConfig: vi.fn(() => uploadConfig)
  }
})

vi.mock('@/server/content/article/image', () => ({
  collectArticleImageNames: mocks.collectArticleImageNames,
  deleteUnusedArticleImagesByNames: mocks.deleteUnusedArticleImagesByNames
}))

vi.mock('@/server/db', () => ({
  ArticleDB: mocks.articleDb
}))

vi.mock('@/server/utils/file-upload', () => ({
  default: mocks.uploaderConstructor
}))

vi.mock('@/types/config', () => ({
  getArticleUploadConfig: mocks.getArticleUploadConfig
}))

const defaultUploadConfig = {
  enabled: true,
  url: '/uploads/articles',
  directory: 'public/uploads/articles',
  maxFiles: 30,
  maxFileSize: 10_485_760,
  allowedTypes: ['image/jpeg', 'image/png'],
  maxSize: { width: 1920, height: 1920 },
  quality: 85
}

beforeEach(() => {
  vi.clearAllMocks()

  mocks.uploaderConstructor.mockImplementation(() => mocks.uploaderInstance)
  mocks.uploaderInstance.validateFileType.mockReturnValue(true)
  mocks.uploaderInstance.validateFileSize.mockReturnValue(true)
  mocks.uploaderInstance.uploadFile.mockResolvedValue({
    filename: 'saved-file.png',
    originalName: 'original.png'
  })
  mocks.uploaderInstance.deleteFile.mockResolvedValue(true)

  mocks.collectArticleImageNames.mockReturnValue([])
  mocks.deleteUnusedArticleImagesByNames.mockResolvedValue()

  mocks.uploadConfig.enabled = defaultUploadConfig.enabled
  mocks.uploadConfig.url = defaultUploadConfig.url
  mocks.uploadConfig.directory = defaultUploadConfig.directory
  mocks.uploadConfig.maxFiles = defaultUploadConfig.maxFiles
  mocks.uploadConfig.maxFileSize = defaultUploadConfig.maxFileSize
  mocks.uploadConfig.allowedTypes = [...defaultUploadConfig.allowedTypes]
  mocks.uploadConfig.maxSize = { ...defaultUploadConfig.maxSize }
  mocks.uploadConfig.quality = defaultUploadConfig.quality

  mocks.getArticleUploadConfig.mockImplementation(() => mocks.uploadConfig)
})

const getCreateHandler = async () => {
  const mod = await import('@/pages/api/admin/article/index')
  return mod.POST
}

const getUpdateHandler = async () => {
  const mod = await import('@/pages/api/admin/article/[id]')
  return mod.PUT
}

const getUploadModule = async () => {
  return await import('@/pages/api/admin/article/upload')
}

describe('POST /api/admin/article', () => {
  it('returns 401 when user is not authenticated', async () => {
    const POST = await getCreateHandler()
    const request = new Request('http://localhost/api/admin/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'タイトル', content: '本文' })
    })

    const response = await POST({ request, locals: {} } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: '認証が必要です'
    })
  })

  it('returns 422 when title or content is missing', async () => {
    const POST = await getCreateHandler()
    const request = new Request('http://localhost/api/admin/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: null })
    })

    const response = await POST({ request, locals: { user: { id: 1 } } } as unknown as Parameters<
      typeof POST
    >[0])

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'タイトルと本文は必須です'
    })
  })

  it('creates an article and returns 201 with payload', async () => {
    const POST = await getCreateHandler()
    const body = {
      title: '新しい記事',
      content: '本文に<img src="/uploads/articles/image-1.png" />',
      featuredImage: 'featured.png',
      attachments: ['file.pdf'],
      tags: ['tag1'],
      category: 'news',
      status: 'published',
      seoDescription: 'desc',
      seoKeywords: 'keyword1,keyword2',
      isMemberOnly: true
    }

    const createdArticle = { id: 10, title: body.title }

    mocks.collectArticleImageNames.mockReturnValue(['image-1.png'])
    mocks.articleDb.createArticle.mockResolvedValue(createdArticle)

    const request = new Request('http://localhost/api/admin/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const response = await POST({ request, locals: { user: { id: 99 } } } as unknown as Parameters<
      typeof POST
    >[0])

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ success: true, data: createdArticle })

    expect(mocks.collectArticleImageNames).toHaveBeenCalledWith(body.content)
    expect(mocks.articleDb.createArticle).toHaveBeenCalledWith({
      title: body.title,
      content: body.content,
      featuredImage: body.featuredImage,
      images: ['image-1.png'],
      attachments: body.attachments,
      tags: body.tags,
      category: body.category,
      status: body.status,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      isMemberOnly: body.isMemberOnly,
      creatorId: 99
    })
  })
})

describe('PUT /api/admin/article/[id]', () => {
  it('returns 401 when user is not authenticated', async () => {
    const PUT = await getUpdateHandler()
    const request = new Request('http://localhost/api/admin/article/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'update' })
    })

    const response = await PUT({
      params: { id: '1' },
      request,
      locals: {}
    } as unknown as Parameters<typeof PUT>[0])

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: '認証が必要です'
    })
  })

  it('returns 400 when id is invalid', async () => {
    const PUT = await getUpdateHandler()
    const request = new Request('http://localhost/api/admin/article/not-a-number', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'update' })
    })

    const response = await PUT({
      params: { id: 'abc' },
      request,
      locals: { user: { id: 1 } }
    } as unknown as Parameters<typeof PUT>[0])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: '不正なIDです'
    })
  })

  it('returns 404 when article is not found', async () => {
    const PUT = await getUpdateHandler()
    const request = new Request('http://localhost/api/admin/article/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'update' })
    })

    mocks.articleDb.getArticleByIdAdmin.mockResolvedValue(null)

    const response = await PUT({
      params: { id: '1' },
      request,
      locals: { user: { id: 1 } }
    } as unknown as Parameters<typeof PUT>[0])

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: '記事が見つかりません'
    })
  })

  it('updates article and returns 200', async () => {
    const PUT = await getUpdateHandler()
    const existingArticle = {
      id: 1,
      content: '古い本文<img src="/uploads/articles/old.png" />',
      images: ['old.png']
    }

    const updatedArticle = {
      id: 1,
      title: '更新後タイトル',
      content: '新しい本文',
      images: ['new.png']
    }

    mocks.articleDb.getArticleByIdAdmin.mockResolvedValue(existingArticle)
    mocks.collectArticleImageNames.mockReturnValue(['new.png'])
    mocks.articleDb.updateArticle
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(updatedArticle)

    const body = {
      title: '更新後タイトル',
      content: '新しい本文',
      featuredImage: 'updated.png',
      tags: ['tag1', 'tag2'],
      category: 'report',
      status: 'published',
      seoDescription: 'seo desc',
      seoKeywords: 'kw1,kw2',
      isMemberOnly: false
    }

    const request = new Request('http://localhost/api/admin/article/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const response = await PUT({
      params: { id: '1' },
      request,
      locals: { user: { id: 1 } }
    } as unknown as Parameters<typeof PUT>[0])

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, data: updatedArticle })

    expect(mocks.articleDb.getArticleByIdAdmin).toHaveBeenCalledWith(1)
    expect(mocks.articleDb.updateArticle).toHaveBeenNthCalledWith(1, 1, {
      title: body.title,
      content: body.content,
      featuredImage: body.featuredImage,
      tags: body.tags,
      category: body.category,
      status: body.status,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      isMemberOnly: body.isMemberOnly
    })
    expect(mocks.deleteUnusedArticleImagesByNames).toHaveBeenCalledWith(existingArticle.images, [
      'new.png'
    ])
    expect(mocks.articleDb.updateArticle).toHaveBeenNthCalledWith(2, 1, { images: ['new.png'] })
  })
})

describe('POST /api/admin/article/upload', () => {
  it('returns 403 when upload is disabled', async () => {
    mocks.uploadConfig.enabled = false
    const { POST } = await getUploadModule()

    const request = new Request('http://localhost/api/admin/article/upload', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST({ request } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'アップロードは無効化されています'
    })
  })

  it('returns 400 when file is missing', async () => {
    const { POST } = await getUploadModule()

    const request = new Request('http://localhost/api/admin/article/upload', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST({ request } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'file is required'
    })
  })

  it('returns 400 when file type is invalid', async () => {
    const { POST } = await getUploadModule()

    mocks.uploaderInstance.validateFileType.mockReturnValue(false)

    const file = new File(['dummy'], 'invalid.svg', { type: 'image/svg+xml' })
    const form = new FormData()
    form.set('file', file)

    const request = new Request('http://localhost/api/admin/article/upload', {
      method: 'POST',
      body: form
    })

    const response = await POST({ request } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'unsupported file type'
    })
  })

  it('uploads file and returns its URL', async () => {
    const { POST } = await getUploadModule()

    const file = new File(['dummy'], 'valid.png', { type: 'image/png' })
    const form = new FormData()
    form.set('file', file)

    mocks.uploaderInstance.uploadFile.mockResolvedValue({
      filename: 'stored.png',
      originalName: 'valid.png'
    })

    const request = new Request('http://localhost/api/admin/article/upload', {
      method: 'POST',
      body: form
    })

    const response = await POST({ request } as unknown as Parameters<typeof POST>[0])

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { url: '/uploads/articles/stored.png' }
    })

    expect(mocks.uploaderInstance.uploadFile).toHaveBeenCalled()
  })
})

describe('DELETE /api/admin/article/upload', () => {
  it('returns 403 when upload is disabled', async () => {
    mocks.uploadConfig.enabled = false
    const { DELETE } = await getUploadModule()

    const request = new Request(
      'http://localhost/api/admin/article/upload?url=/uploads/articles/file.png',
      {
        method: 'DELETE'
      }
    )

    const response = await DELETE({ request } as unknown as Parameters<typeof DELETE>[0])

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'アップロードは無効化されています'
    })
  })

  it('returns 400 when url is missing', async () => {
    const { DELETE } = await getUploadModule()

    const request = new Request('http://localhost/api/admin/article/upload', {
      method: 'DELETE'
    })

    const response = await DELETE({ request } as unknown as Parameters<typeof DELETE>[0])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'url is required'
    })
  })

  it('returns 400 when url is outside allowed path', async () => {
    const { DELETE } = await getUploadModule()

    const request = new Request(
      'http://localhost/api/admin/article/upload?url=/uploads/other/file.png',
      {
        method: 'DELETE'
      }
    )

    const response = await DELETE({ request } as unknown as Parameters<typeof DELETE>[0])

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'invalid path'
    })
  })

  it('deletes file when url is valid', async () => {
    const { DELETE } = await getUploadModule()

    const request = new Request(
      'http://localhost/api/admin/article/upload?url=/uploads/articles/stored.png',
      {
        method: 'DELETE'
      }
    )

    const response = await DELETE({ request } as unknown as Parameters<typeof DELETE>[0])

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { deleted: true }
    })

    expect(mocks.uploaderInstance.deleteFile).toHaveBeenCalledWith('stored.png')
  })
})
