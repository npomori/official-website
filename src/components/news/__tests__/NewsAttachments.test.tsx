import type { NewsAttachment } from '@/types/news'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewsAttachments from '../NewsAttachments'

// fetch のモック
global.fetch = vi.fn()

describe('NewsAttachments', () => {
  const mockAttachments: NewsAttachment[] = [
    {
      name: 'テストファイル1.pdf',
      filename: 'test-file-1.pdf',
      size: 1024
    },
    {
      name: '資料.docx',
      filename: 'document-123456.docx',
      size: 2048
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['test content'], { type: 'application/pdf' })
    })
    // alert 関数をモック
    global.alert = vi.fn()
  })

  it('添付ファイルが表示される', () => {
    render(<NewsAttachments newsId={1} attachments={mockAttachments} />)

    expect(screen.getByText('テストファイル1.pdf')).toBeInTheDocument()
    expect(screen.getByText('資料.docx')).toBeInTheDocument()
  })

  it('ファイルサイズが表示される', () => {
    render(<NewsAttachments newsId={1} attachments={mockAttachments} />)

    // スペースなしの表示形式に対応
    expect(screen.getByText('1KB')).toBeInTheDocument()
    expect(screen.getByText('2KB')).toBeInTheDocument()
  })

  it('添付ファイルがない場合は何も表示されない', () => {
    const { container } = render(<NewsAttachments newsId={1} attachments={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('ダウンロードボタンをクリックするとファイルがダウンロードされる', async () => {
    render(<NewsAttachments newsId={1} attachments={mockAttachments} />)

    const downloadButtons = screen.getAllByText('ダウンロード')
    fireEvent.click(downloadButtons[0])

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/news/download/1/test-file-1.pdf')
    })
  })

  it('添付ファイルは name プロパティを持ち originalName は持たない', () => {
    const attachment = mockAttachments[0]

    expect(attachment).toHaveProperty('name')
    expect(attachment).toHaveProperty('filename')
    expect(attachment).toHaveProperty('size')
    expect(attachment).not.toHaveProperty('originalName')
  })

  it('添付ファイルの型が正しい', () => {
    mockAttachments.forEach((attachment) => {
      expect(typeof attachment.name).toBe('string')
      expect(typeof attachment.filename).toBe('string')
      expect(typeof attachment.size).toBe('number')
    })
  })

  it('ダウンロードエラー時にアラートが表示される', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false
    })

    render(<NewsAttachments newsId={1} attachments={mockAttachments} />)

    const downloadButtons = screen.getAllByText('ダウンロード')
    fireEvent.click(downloadButtons[0])

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('ファイルのダウンロードに失敗しました')
    })
  })
})
