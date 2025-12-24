import RecordModal from '@/components/record/RecordModal'
import AdminRecordFetch from '@/fetch/admin/record'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モック設定
vi.mock('@/fetch/admin/record', () => ({
  default: {
    getRecord: vi.fn(),
    createRecordWithImages: vi.fn(),
    updateRecordWithImages: vi.fn()
  }
}))

// config のモック
vi.mock('@/types/config', () => ({
  default: {
    content: {
      titleMaxLength: 100
    }
  },
  getRecordUploadConfig: vi.fn(() => ({
    enabled: true,
    directory: 'public/uploads/records',
    url: '/uploads/records',
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxSize: {
      width: 1920,
      height: 1080
    },
    quality: 85,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
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

describe('RecordModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const defaultProps = {
    onClose: mockOnClose,
    onSuccess: mockOnSuccess
  }

  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe('新規作成モード', () => {
    it('新規作成モードで正しくレンダリングされる', async () => {
      render(<RecordModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('活動記録を追加')).toBeInTheDocument()
      })

      expect(screen.getByLabelText(/活動場所/)).toBeInTheDocument()
      expect(screen.getByText('活動日')).toBeInTheDocument()
      expect(screen.getByLabelText(/天候/)).toBeInTheDocument()
      expect(screen.getByLabelText(/参加者/)).toBeInTheDocument()
      expect(screen.getByLabelText(/報告者/)).toBeInTheDocument()
      expect(screen.getByLabelText(/活動内容/)).toBeInTheDocument()
      expect(screen.getByText('追加する')).toBeInTheDocument()
    })

    it('必須項目が入力されている場合、登録に成功する', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminRecordFetch.createRecordWithImages).mockResolvedValue({
        success: true,
        message: '活動記録を追加しました',
        record: {
          id: 1,
          location: '箕面国有林',
          datetime: '2025年12月24日',
          eventDate: new Date('2025-12-24'),
          weather: '晴れ',
          participants: '35名',
          reporter: '大阪太郎',
          content: 'テスト活動内容',
          categories: ['mowing'],
          images: [],
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      })

      render(<RecordModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 必須フィールドを入力
      const locationInput = screen.getByLabelText(/活動場所/) as HTMLInputElement
      const weatherInput = screen.getByLabelText(/天候/) as HTMLInputElement
      const participantsInput = screen.getByLabelText(/参加者/) as HTMLInputElement
      const reporterInput = screen.getByLabelText(/報告者/) as HTMLInputElement
      const contentInput = screen.getByLabelText(/活動内容/) as HTMLTextAreaElement

      await user.type(locationInput, '箕面国有林')
      await user.type(weatherInput, '晴れ')
      await user.type(participantsInput, '35名')
      await user.type(reporterInput, '大阪太郎')
      await user.type(contentInput, 'テスト活動内容')

      // datetime を設定 (DateRangePicker はform controlではないのでReact Hook Formを直接操作)
      // まずカレンダーボタンをクリック
      const calendarButton = screen.getByRole('button', { name: /日付を選択/ })
      await user.click(calendarButton)
      // カレンダーが開いたら今日の日付をクリック (24日)
      await waitFor(async () => {
        const dateButtons = screen.queryAllByText('24')
        if (dateButtons.length > 0) {
          await user.click(dateButtons[0])
        }
      })

      // 追加ボタンをクリック
      const submitButton = screen.getByText('追加する')
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(AdminRecordFetch.createRecordWithImages).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )

      await waitFor(() => {
        expect(screen.getByText('活動記録を追加しました')).toBeInTheDocument()
      })
    })

    it('下書きとして保存できる', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminRecordFetch.createRecordWithImages).mockResolvedValue({
        success: true,
        message: '活動記録を追加しました',
        record: {
          id: 1,
          location: '箕面国有林',
          datetime: '2025年12月24日',
          eventDate: new Date('2025-12-24'),
          weather: '晴れ',
          participants: '35名',
          reporter: '大阪太郎',
          content: 'テスト活動内容',
          categories: [],
          images: [],
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      })

      render(<RecordModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 必須フィールドを入力
      const locationInput = screen.getByLabelText(/活動場所/) as HTMLInputElement
      const weatherInput = screen.getByLabelText(/天候/) as HTMLInputElement
      const participantsInput = screen.getByLabelText(/参加者/) as HTMLInputElement
      const reporterInput = screen.getByLabelText(/報告者/) as HTMLInputElement
      const contentInput = screen.getByLabelText(/活動内容/) as HTMLTextAreaElement

      await user.type(locationInput, '箕面国有林')
      await user.type(weatherInput, '晴れ')
      await user.type(participantsInput, '35名')
      await user.type(reporterInput, '大阪太郎')
      await user.type(contentInput, 'テスト活動内容')

      // datetime を設定 (DateRangePicker はform controlではないのでReact Hook Formを直接操作)
      // まずカレンダーボタンをクリック
      const calendarButton = screen.getByRole('button', { name: /日付を選択/ })
      await user.click(calendarButton)
      // カレンダーが開いたら今日の日付をクリック (24日)
      await waitFor(async () => {
        const dateButtons = screen.queryAllByText('24')
        if (dateButtons.length > 0) {
          await user.click(dateButtons[0])
        }
      })

      // 下書きチェックボックスをクリック
      const draftCheckbox = screen.getByLabelText(/下書きとして保存/)
      await user.click(draftCheckbox)

      // 追加ボタンをクリック
      const submitButton = screen.getByText('追加する')
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(AdminRecordFetch.createRecordWithImages).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })

    it('エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminRecordFetch.createRecordWithImages).mockResolvedValue({
        success: false,
        message: '活動記録の追加に失敗しました'
      })

      render(<RecordModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 必須フィールドを入力
      const locationInput = screen.getByLabelText(/活動場所/) as HTMLInputElement
      const weatherInput = screen.getByLabelText(/天候/) as HTMLInputElement
      const participantsInput = screen.getByLabelText(/参加者/) as HTMLInputElement
      const reporterInput = screen.getByLabelText(/報告者/) as HTMLInputElement
      const contentInput = screen.getByLabelText(/活動内容/) as HTMLTextAreaElement

      await user.type(locationInput, '箕面国有林')
      await user.type(weatherInput, '晴れ')
      await user.type(participantsInput, '35名')
      await user.type(reporterInput, '大阪太郎')
      await user.type(contentInput, 'テスト活動内容')

      // datetime を設定 (DateRangePicker はform controlではないのでReact Hook Formを直接操作)
      // まずカレンダーボタンをクリック
      const calendarButton = screen.getByRole('button', { name: /日付を選択/ })
      await user.click(calendarButton)
      // カレンダーが開いたら今日の日付をクリック (24日)
      await waitFor(async () => {
        const dateButtons = screen.queryAllByText('24')
        if (dateButtons.length > 0) {
          await user.click(dateButtons[0])
        }
      })

      // 追加ボタンをクリック
      const submitButton = screen.getByText('追加する')
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(screen.getByText('活動記録の追加に失敗しました')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('編集モード', () => {
    const mockRecordData = {
      id: 1,
      location: '箕面国有林',
      datetime: '2025年12月24日',
      eventDate: new Date('2025-12-24'),
      weather: '晴れ',
      participants: '35名',
      reporter: '大阪太郎',
      content: 'テスト活動内容',
      nearMiss: 'なし',
      equipment: 'チェーンソー',
      remarks: '特になし',
      categories: ['mowing'],
      images: ['test-image.jpg'],
      status: 'published',
      createdAt: new Date(),
      updatedAt: new Date(),
      creator: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }
    }

    beforeEach(() => {
      vi.mocked(AdminRecordFetch.getRecord).mockResolvedValue({
        success: true,
        data: mockRecordData
      })
    })

    it('編集モードで正しくレンダリングされる', async () => {
      render(<RecordModal {...defaultProps} isEditMode={true} recordId={1} />)

      await waitFor(() => {
        expect(screen.getByText('活動記録を編集')).toBeInTheDocument()
      })

      await waitFor(() => {
        const locationInput = screen.getByLabelText(/活動場所/) as HTMLInputElement
        expect(locationInput.value).toBe('箕面国有林')
      })

      expect(screen.getByText('更新する')).toBeInTheDocument()
    })

    it('編集モードで記録を更新できる', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminRecordFetch.updateRecordWithImages).mockResolvedValue({
        success: true,
        message: '活動記録を更新しました',
        data: mockRecordData
      })

      render(
        <RecordModal {...defaultProps} isEditMode={true} recordId={1} record={mockRecordData} />
      )

      await waitFor(() => {
        expect(screen.getByText('活動記録を編集')).toBeInTheDocument()
      })

      // フィールドを変更
      const locationInput = screen.getByLabelText(/活動場所/) as HTMLInputElement
      await user.clear(locationInput)
      await user.type(locationInput, '新しい活動場所')

      // 更新ボタンをクリック
      const submitButton = screen.getByText('更新する')
      await user.click(submitButton)

      await waitFor(() => {
        expect(AdminRecordFetch.updateRecordWithImages).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('活動記録を更新しました')).toBeInTheDocument()
      })
    })

    it('下書き状態の記録を編集時に下書きチェックが入っている', async () => {
      const draftRecord = { ...mockRecordData, status: 'draft' }
      vi.mocked(AdminRecordFetch.getRecord).mockResolvedValue({
        success: true,
        data: draftRecord
      })

      render(<RecordModal {...defaultProps} isEditMode={true} recordId={1} record={draftRecord} />)

      await waitFor(() => {
        expect(screen.getByText('活動記録を編集')).toBeInTheDocument()
      })

      await waitFor(() => {
        const draftCheckbox = screen.getByLabelText(/下書きとして保存/) as HTMLInputElement
        expect(draftCheckbox.checked).toBe(true)
      })
    })
  })

  describe('閉じる機能', () => {
    it('閉じるボタンをクリックするとモーダルが閉じる', async () => {
      const user = userEvent.setup()
      render(<RecordModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('活動記録を追加')).toBeInTheDocument()
      })

      // ×ボタンを探してクリック
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find((button) => {
        const svg = button.querySelector('svg')
        return svg && svg.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
      })

      expect(closeButton).toBeDefined()
      if (closeButton) {
        await user.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })
  })
})
