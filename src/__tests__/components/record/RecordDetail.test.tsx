import RecordDetail from '@/components/record/RecordDetail'
import adminRecordFetch from '@/fetch/admin/record'
import recordFetch from '@/fetch/record'
import { userStore } from '@/store/user'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モック設定
vi.mock('@/fetch/record', () => ({
  default: {
    getRecordById: vi.fn()
  }
}))

vi.mock('@/fetch/admin/record', () => ({
  default: {
    getRecordById: vi.fn()
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

// config のモック
vi.mock('@/types/config', () => ({
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

const mockRecordData = {
  id: 1,
  location: '箕面国有林',
  datetime: '2025年12月24日',
  eventDate: new Date('2025-12-24'),
  weather: '晴れ、気温12℃',
  participants: '35名（一般参加者25名、スタッフ10名）',
  reporter: '大阪太郎',
  content: '今日は草刈りと整備作業を行いました。',
  nearMiss: '特になし',
  equipment: 'チェーンソー、草払機',
  remarks: '次回は植樹を予定',
  categories: ['mowing', 'maintenance'],
  images: ['record-image1.jpg', 'record-image2.jpg'],
  status: 'published',
  createdAt: new Date('2025-12-24'),
  updatedAt: new Date('2025-12-24'),
  creator: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com'
  }
}

describe('RecordDetail', () => {
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
    })

    it('記録詳細が正しく表示される', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('箕面国有林')).toBeInTheDocument()
      })

      expect(screen.getByText('2025年12月24日')).toBeInTheDocument()
      expect(screen.getByText('晴れ、気温12℃')).toBeInTheDocument()
      expect(screen.getByText('35名（一般参加者25名、スタッフ10名）')).toBeInTheDocument()
      expect(screen.getByText('大阪太郎')).toBeInTheDocument()
      expect(screen.getByText('今日は草刈りと整備作業を行いました。')).toBeInTheDocument()
    })

    it('カテゴリーが正しく表示される', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('草刈り')).toBeInTheDocument()
      })

      expect(screen.getByText('整備')).toBeInTheDocument()
    })

    it('オプション項目が表示される', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('ヒヤリハット')).toBeInTheDocument()
      })

      expect(screen.getByText('特になし')).toBeInTheDocument()
      expect(screen.getByText('動力使用')).toBeInTheDocument()
      expect(screen.getByText('チェーンソー、草払機')).toBeInTheDocument()
      expect(screen.getByText('備考')).toBeInTheDocument()
      expect(screen.getByText('次回は植樹を予定')).toBeInTheDocument()
    })

    it('記録が見つからない場合にエラーメッセージが表示される', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: false,
        message: '記録が見つかりません'
      })

      render(<RecordDetail recordId="999" />)

      await waitFor(() => {
        expect(screen.getByText(/記録が見つかりません/)).toBeInTheDocument()
      })
    })

    it('編集ボタンが表示されない', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('箕面国有林')).toBeInTheDocument()
      })

      expect(screen.queryByText('編集する')).not.toBeInTheDocument()
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
      })
    })

    it('管理者用APIで記録を取得する', async () => {
      vi.mocked(adminRecordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(adminRecordFetch.getRecordById).toHaveBeenCalledWith(1)
      })

      expect(screen.getByText('箕面国有林')).toBeInTheDocument()
    })

    it('編集ボタンが表示される', async () => {
      vi.mocked(adminRecordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('編集する')).toBeInTheDocument()
      })
    })
  })

  describe('画像表示', () => {
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
    })

    it('画像が表示される', async () => {
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('画像をクリックするとモーダルが開く', async () => {
      const user = userEvent.setup()
      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: mockRecordData
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })

      const firstImage = screen.getAllByRole('img')[0]
      await user.click(firstImage)

      // モーダルが開くことを確認（実装に依存）
      await waitFor(() => {
        expect(document.body.classList.contains('overflow-hidden')).toBe(true)
      })
    })
  })

  describe('ローディング状態', () => {
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
    })

    it('ローディング中にスピナーが表示される', () => {
      vi.mocked(recordFetch.getRecordById).mockImplementation(
        () =>
          new Promise(() => {
            // 永遠に解決しないPromise
          })
      )

      render(<RecordDetail recordId="1" />)

      expect(screen.getByText(/読み込み中/i)).toBeInTheDocument()
    })
  })

  describe('オプション項目が空の場合', () => {
    beforeEach(async () => {
      const { useStore } = await import('@nanostores/react')
      vi.mocked(useStore).mockReturnValue(null)
    })

    it('オプション項目が空の場合は表示されない', async () => {
      const recordWithoutOptionals = {
        ...mockRecordData,
        nearMiss: null,
        equipment: null,
        remarks: null
      }

      vi.mocked(recordFetch.getRecordById).mockResolvedValue({
        success: true,
        data: recordWithoutOptionals
      })

      render(<RecordDetail recordId="1" />)

      await waitFor(() => {
        expect(screen.getByText('箕面国有林')).toBeInTheDocument()
      })

      // オプション項目のラベルが表示されていないことを確認
      expect(screen.queryByText('ヒヤリハット')).not.toBeInTheDocument()
      expect(screen.queryByText('動力使用')).not.toBeInTheDocument()
      expect(screen.queryByText('備考')).not.toBeInTheDocument()
    })
  })
})
