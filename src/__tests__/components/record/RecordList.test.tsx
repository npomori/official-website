import RecordList from '@/components/record/RecordList'
import adminRecordFetch from '@/fetch/admin/record'
import recordFetch from '@/fetch/record'
import { userStore } from '@/store/user'
import type { useStore } from '@nanostores/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モック設定
vi.mock('@/fetch/record', () => ({
  default: {
    getRecords: vi.fn()
  }
}))

vi.mock('@/fetch/admin/record', () => ({
  default: {
    getRecords: vi.fn(),
    deleteRecord: vi.fn()
  }
}))

vi.mock('@/store/user', () => ({
  userStore: {
    get: vi.fn(),
    subscribe: vi.fn()
  }
}))

// useStore のモック
vi.mock('@nanostores/react', () => ({
  useStore: vi.fn()
}))

// SWR のモック
vi.mock('@/hooks/swr', () => ({
  default: vi.fn()
}))

// config のモック
vi.mock('@/types/config', () => ({
  getConfig: vi.fn(() => ({
    pagination: {
      recordList: {
        itemsPerPage: 10
      }
    }
  })),
  getRecordUploadConfig: vi.fn(() => ({
    url: '/uploads/records'
  }))
}))

// record-category.json のモック
vi.mock('@/config/record-category.json', () => ({
  default: [
    { value: 'mowing', name: '草刈り' },
    { value: 'planting', name: '植樹' },
    { value: 'maintenance', name: '整備' },
    { value: 'observation', name: '観察会' }
  ]
}))

// RecordModal のモック
vi.mock('@/components/record/RecordModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="record-modal">
      <div>RecordModal</div>
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

const mockRecordsData = {
  records: [
    {
      id: 1,
      location: '箕面国有林',
      datetime: '2025年12月24日',
      eventDate: new Date('2025-12-24'),
      weather: '晴れ',
      participants: '35名',
      reporter: '大阪太郎',
      content: 'テスト活動内容1',
      categories: ['mowing'],
      images: ['image1.jpg'],
      status: 'published',
      createdAt: new Date('2025-12-24'),
      updatedAt: new Date('2025-12-24'),
      creator: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }
    },
    {
      id: 2,
      location: '大阪城公園',
      datetime: '2025年12月25日',
      eventDate: new Date('2025-12-25'),
      weather: '曇り',
      participants: '20名',
      reporter: '京都花子',
      content: 'テスト活動内容2',
      categories: ['planting'],
      images: [],
      status: 'published',
      createdAt: new Date('2025-12-25'),
      updatedAt: new Date('2025-12-25'),
      creator: {
        id: 2,
        name: 'Test User 2',
        email: 'test2@example.com'
      }
    }
  ],
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalCount: 2,
    totalPages: 1
  }
}

describe('RecordList', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    // デフォルトで未認証状態
    const { useStore } = await import('@nanostores/react')
    vi.mocked(useStore).mockReturnValue(null)
  })

  describe('一般ユーザー（非管理者）', () => {
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      const swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule.default).mockReturnValue({
        data: mockRecordsData,
        error: null,
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('記録一覧が正しく表示される', async () => {
      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getByText('箕面国有林')).toBeInTheDocument()
      })

      expect(screen.getByText('大阪城公園')).toBeInTheDocument()
      expect(screen.getByText('2025年12月24日')).toBeInTheDocument()
      expect(screen.getByText('2025年12月25日')).toBeInTheDocument()
    })

    it('カテゴリーフィルターが表示される', () => {
      render(<RecordList />)

      expect(screen.getByText('すべて')).toBeInTheDocument()
      expect(screen.getByText('草刈り')).toBeInTheDocument()
      expect(screen.getByText('植樹')).toBeInTheDocument()
      expect(screen.getByText('整備')).toBeInTheDocument()
      expect(screen.getByText('観察会')).toBeInTheDocument()
    })

    it('カテゴリーフィルターをクリックしてフィルタリングできる', async () => {
      const user = userEvent.setup()
      const mutateMock = vi.fn()

      const swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule.default).mockReturnValue({
        data: mockRecordsData,
        error: null,
        isLoading: false,
        mutate: mutateMock
      })

      render(<RecordList />)

      const mowingButton = screen.getByText('草刈り')
      await user.click(mowingButton)

      // フィルターが変更されたことを確認
      await waitFor(() => {
        expect(mowingButton.closest('button')).toHaveClass('bg-primary-500')
      })
    })

    it('編集・削除ボタンが表示されない', async () => {
      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getByText('箕面国有林')).toBeInTheDocument()
      })

      expect(screen.queryByText('編集')).not.toBeInTheDocument()
      expect(screen.queryByText('削除')).not.toBeInTheDocument()
    })
  })

  describe('管理者ユーザー', () => {
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue({
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN'
      const swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: mockRecordsData,
        error: null,
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('編集ボタンが表示される', async () => {
      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getAllByText('編集').length).toBeGreaterThan(0)
      })
    })

    it('削除ボタンが表示される', async () => {
      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getAllByText('削除').length).toBeGreaterThan(0)
      })
    })

    it('編集ボタンをクリックすると編集モーダルが開く', async () => {
      const user = userEvent.setup()
      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getAllByText('編集')[0]).toBeInTheDocument()
      })

      const editButton = screen.getAllByText('編集')[0]
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('record-modal')).toBeInTheDocument()
      })
    })

    it('削除ボタンをクリックすると確認ダイアログが表示される', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(adminRecordFetch.deleteRecord).mockResolvedValue({
        success: true,
        message: '記録を削除しました'
      })

      render(<RecordList />)

      await waitFor(() => {
        expect(screen.getAllByText('削除')[0]).toBeInTheDocument()
      })

      const deleteButton = screen.getAllByText('削除')[0]
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalled()

      await waitFor(() => {
        expect(adminRecordFetch.deleteRecord).toHaveBeenCalledWith(1)
      })

      confirmSpy.mockRestore()
    })
  })

  describe('ページネーション', () => {
    beforeEach(async () => {
      const swrModule = await import('@/hooks/swr')
      vi.mocked(swrModulet('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: {
          ...mockRecordsData,
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalCount: 25,
            totalPages: 3
          }
        },
        error: null,
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('ページネーションが表示される', () => {
      render(<RecordList />)

      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('次のページに移動できる', async () => {
      const user = userEvent.setup()
      render(<RecordList />)

      const nextButton = screen.getByLabelText('次のページ')
      await user.click(nextButton)

      // ページが変更されたことを確認（実装に依存）
      await waitFor(() => {
        expect(screen.getByLabelText('次のページ')).toBeInTheDocument()
      })
    })
  })

  describe('ローディング状態', () => {
    beforeEach(async () => {
      const swrModule = await import('@/hooks/swr')
      vi.mocked(swrModulet('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: vi.fn()
      })
    })

    it('ローディング中にスピナーが表示される', () => {
      render(<RecordList />)

      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    beconst swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: undefined,
        error: new Error('データの取得に失敗しました'),
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('エラーメッセージが表示される', () => {
      render(<RecordList />)

      expect(screen.getByText(/データの取得に失敗しました/i)).toBeInTheDocument()
    })
  })

  describe('記録0件の場合', () => {
    beconst swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: {
          records: [],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalCount: 0,
            totalPages: 0
          }
        },
        error: null,
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('空のメッセージが表示される', () => {
      render(<RecordList />)

      expect(screen.getByText(/活動記録がありません/i)).toBeInTheDocument()
    })
  })

  descconst swrModule = await import('@/hooks/swr')
      vi.mocked(swrModule
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
      vi.mocked(require('@/hooks/swr').default).mockReturnValue({
        data: mockRecordsData,
        error: null,
        isLoading: false,
        mutate: vi.fn()
      })
    })

    it('サムネイル画像が表示される', async () => {
      render(<RecordList />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('画像をクリックするとモーダルが開く', async () => {
      const user = userEvent.setup()
      render(<RecordList />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })

      const firstImage = screen.getAllByRole('img')[0]
      await user.click(firstImage)

      // モーダルが開くことを確認
      await waitFor(() => {
        expect(document.body.classList.contains('overflow-hidden')).toBe(true)
      })
    })
  })
})
