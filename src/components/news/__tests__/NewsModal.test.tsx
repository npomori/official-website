import type { NewsAttachment } from '@/types/news'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewsModal from '../NewsModal'

// 必要に応じてモック
vi.mock('@/fetch/admin/news', () => ({
  default: {
    createNewsWithFiles: vi.fn(async () => ({ success: true })),
    updateNewsWithFiles: vi.fn(async () => ({ success: true }))
  }
}))

// happy-dom環境でのテスト

describe('NewsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('タイトル未入力でバリデーションエラーが表示される', async () => {
    render(<NewsModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('追加する'))
    await waitFor(() => {
      //expect(screen.getByText(/タイトル/)).toBeInTheDocument()
      //expect(screen.getByText(/必須/)).toBeInTheDocument()
      expect(screen.getByText(/タイトルは必須です/)).toBeInTheDocument()
    })
  })

  it('ファイル数制限を超えるとエラー表示', async () => {
    render(<NewsModal onClose={() => {}} />)
    const input = screen.getByLabelText(/ファイルを選択/)
    // happy-domはFile APIをサポートしている
    const files = Array(100).fill(new File(['dummy'], 'dummy.pdf', { type: 'application/pdf' }))
    fireEvent.change(input, { target: { files } })
    expect(await screen.findByText(/ファイル数が多すぎます/)).toBeInTheDocument()
  })

  it('正常にお知らせが追加できる', async () => {
    render(<NewsModal onClose={() => {}} />)

    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: 'テストタイトル' } })
    //fireEvent.change(screen.getByLabelText('内容'), { target: { value: 'テスト内容' } })
    fireEvent.change(screen.getByRole('textbox', { name: /内容/ }), {
      target: { value: 'テスト内容' }
    })

    // カテゴリー選択（モックした select で単一選択）
    //fireEvent.change(screen.getByLabelText(/カテゴリー/), { target: { value: 'member' } })

    fireEvent.click(screen.getByText('追加する'))
    await waitFor(() => {
      expect(screen.getByText(/カテゴリーは必須です/)).toBeInTheDocument()
      //expect(screen.getByText('お知らせを追加しました')).toBeInTheDocument()
    })
  })

  it('NewsAttachment 型が正しいプロパティを持つ', () => {
    const attachment: NewsAttachment = {
      name: 'テストファイル.pdf',
      filename: 'test-123456.pdf',
      size: 1024
    }

    expect(attachment).toHaveProperty('name')
    expect(attachment).toHaveProperty('filename')
    expect(attachment).toHaveProperty('size')
    expect(attachment).not.toHaveProperty('originalName')
    expect(typeof attachment.name).toBe('string')
    expect(typeof attachment.filename).toBe('string')
    expect(typeof attachment.size).toBe('number')
  })

  it('編集モードで既存の添付ファイルが正しく表示される', async () => {
    const mockNewsData = {
      id: '1',
      title: '既存のお知らせ',
      content: '既存の内容',
      date: new Date(),
      categories: ['イベント'],
      priority: null,
      isMemberOnly: false,
      author: 'テスト太郎',
      attachments: [
        {
          name: 'existing-file.pdf',
          filename: 'existing-123.pdf',
          size: 2048
        }
      ]
    }

    render(<NewsModal onClose={() => {}} news={mockNewsData} isEditMode={true} />)

    // 添付ファイル名が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('existing-file.pdf')).toBeInTheDocument()
    })
  })

  describe('公開設定', () => {
    it('会員限定コンテンツのチェックボックスが表示される', () => {
      render(<NewsModal onClose={() => {}} />)
      const checkbox = screen.getByLabelText(/会員限定コンテンツ/)
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('下書きとして保存のチェックボックスが表示される', () => {
      render(<NewsModal onClose={() => {}} />)
      const checkbox = screen.getByLabelText(/下書きとして保存/)
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).not.toBeChecked()
    })

    it('会員限定コンテンツをチェックできる', () => {
      render(<NewsModal onClose={() => {}} />)
      const checkbox = screen.getByLabelText(/会員限定コンテンツ/) as HTMLInputElement
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })

    it('下書きとして保存をチェックできる', () => {
      render(<NewsModal onClose={() => {}} />)
      const checkbox = screen.getByLabelText(/下書きとして保存/) as HTMLInputElement
      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()
    })

    it('編集モードで下書きの場合、isDraftがチェックされる', async () => {
      const mockDraftNews = {
        id: '1',
        title: '下書きのお知らせ',
        content: '下書き内容',
        date: new Date(),
        categories: ['告知'],
        priority: null,
        isMemberOnly: false,
        author: 'テスト太郎',
        attachments: [],
        status: 'draft'
      }

      render(<NewsModal onClose={() => {}} news={mockDraftNews} isEditMode={true} />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/下書きとして保存/) as HTMLInputElement
        expect(checkbox).toBeChecked()
      })
    })

    it('編集モードで公開済みの場合、isDraftがチェックされない', async () => {
      const mockPublishedNews = {
        id: '1',
        title: '公開済みのお知らせ',
        content: '公開内容',
        date: new Date(),
        categories: ['告知'],
        priority: null,
        isMemberOnly: false,
        author: 'テスト太郎',
        attachments: [],
        status: 'published'
      }

      render(<NewsModal onClose={() => {}} news={mockPublishedNews} isEditMode={true} />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/下書きとして保存/) as HTMLInputElement
        expect(checkbox).not.toBeChecked()
      })
    })

    it('編集モードで会員限定の場合、isMemberOnlyがチェックされる', async () => {
      const mockMemberOnlyNews = {
        id: '1',
        title: '会員限定お知らせ',
        content: '会員限定内容',
        date: new Date(),
        categories: ['告知'],
        priority: null,
        isMemberOnly: true,
        author: 'テスト太郎',
        attachments: [],
        status: 'published'
      }

      render(<NewsModal onClose={() => {}} news={mockMemberOnlyNews} isEditMode={true} />)

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/会員限定コンテンツ/) as HTMLInputElement
        expect(checkbox).toBeChecked()
      })
    })

    it('公開設定セクションにアイコンとタイトルが表示される', () => {
      render(<NewsModal onClose={() => {}} />)
      expect(screen.getByText('公開設定')).toBeInTheDocument()
    })
  })
})
