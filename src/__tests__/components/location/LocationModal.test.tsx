import LocationModal from '@/components/location/LocationModal'
import AdminLocationFetch from '@/fetch/admin/location'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// モック設定
vi.mock('@/fetch/admin/location', () => ({
  default: {
    getLocationById: vi.fn(),
    createLocationWithFiles: vi.fn(),
    updateLocationWithFiles: vi.fn()
  }
}))

// config のモック
vi.mock('@/config/config.json', () => ({
  default: {
    upload: {
      location: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        maxFiles: 10
      }
    },
    content: {
      titleMaxLength: 100,
      descriptionMaxLength: 1000
    }
  }
}))

// location-type.json のモック
vi.mock('@/config/location-type.json', () => ({
  default: [
    { value: 'regular', label: '定期活動' },
    { value: 'meeting', label: '集会所' }
  ]
}))

// location.json のモック
vi.mock('@/config/location.json', () => ({
  default: [
    { value: 'test-location-1', name: 'テスト活動地1', lat: 35.0, lng: 135.0 },
    { value: 'test-location-2', name: 'テスト活動地2', lat: 35.1, lng: 135.1 }
  ]
}))

describe('LocationModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const defaultProps = {
    locationId: 'test-location-1',
    onClose: mockOnClose,
    onSuccess: mockOnSuccess
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // document.body をクリーンアップ
    document.body.innerHTML = ''
  })

  describe('新規登録モード', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: false,
        message: 'Not found'
      })
    })

    it('新規登録モードで正しくレンダリングされる', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('活動地を登録')).toBeInTheDocument()
      })

      expect(screen.getByText('テスト活動地1')).toBeInTheDocument()
      expect(screen.getByLabelText(/ID/)).toBeDisabled()
      expect(screen.getByText('登録する')).toBeInTheDocument()
    })

    it('必須項目が入力されている場合、登録に成功する', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminLocationFetch.createLocationWithFiles).mockResolvedValue({
        success: true,
        data: {
          id: 'test-location-1',
          name: 'テスト活動地1',
          position: [35.0, 135.0],
          type: 'regular'
        }
      })

      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 名称フィールドが事前に入力されていることを確認
      const nameInput = screen.getByLabelText(/名称/) as HTMLInputElement
      expect(nameInput.value).toBe('テスト活動地1')

      // 位置情報を入力
      const latInput = screen.getByLabelText(/緯度/) as HTMLInputElement
      const lngInput = screen.getByLabelText(/経度/) as HTMLInputElement

      await user.clear(latInput)
      await user.type(latInput, '35.0')
      await user.clear(lngInput)
      await user.type(lngInput, '135.0')

      // 登録ボタンをクリック
      const submitButton = screen.getByText('登録する')
      await user.click(submitButton)

      await waitFor(() => {
        expect(AdminLocationFetch.createLocationWithFiles).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('活動地を登録しました')).toBeInTheDocument()
      })
    })

    it('エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminLocationFetch.createLocationWithFiles).mockResolvedValue({
        success: false,
        message: '登録に失敗しました'
      })

      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 登録ボタンをクリック
      const submitButton = screen.getByText('登録する')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('登録に失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('編集モード', () => {
    const mockLocationData = {
      id: 'test-location-1',
      name: 'テスト活動地1',
      position: [35.0, 135.0] as [number, number],
      type: 'regular' as const,
      activities: '毎週日曜日に活動しています',
      image: 'location-image.jpg',
      address: '大阪府大阪市',
      hasDetail: true,
      status: 'published' as const,
      activityDetails: '詳細な活動内容',
      fieldCharacteristics: '広い草地',
      access: '駅から徒歩10分',
      facilities: 'トイレあり',
      schedule: '毎週日曜日 10:00-12:00',
      requirements: '特になし',
      participationFee: '無料',
      contact: 'test@example.com',
      organizer: '大阪支部',
      startedDate: '2020-01-01',
      notes: '雨天中止',
      other: 'その他の情報',
      meetingAddress: '集合場所住所',
      meetingTime: '10:00',
      meetingMapUrl: 'https://example.com/map',
      meetingAdditionalInfo: '集合場所追加情報',
      gallery: [
        { filename: 'gallery1.jpg', url: '/uploads/locations/gallery1.jpg', caption: '写真1' },
        { filename: 'gallery2.jpg', url: '/uploads/locations/gallery2.jpg', caption: '写真2' }
      ],
      attachments: [
        { name: '資料1.pdf', filename: 'doc1.pdf', size: 1024 },
        { name: '資料2.pdf', filename: 'doc2.pdf', size: 2048 }
      ],
      upcomingDates: ['2025-12-20', '2025-12-27']
    }

    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: true,
        data: mockLocationData
      })
    })

    it('編集モードで正しくレンダリングされる', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('活動地を編集')).toBeInTheDocument()
      })

      expect(screen.getByText('テスト活動地1')).toBeInTheDocument()
      expect(screen.getByText('更新する')).toBeInTheDocument()
    })

    it('既存データが正しくフォームに反映される', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(AdminLocationFetch.getLocationById).toHaveBeenCalledWith('test-location-1')
      })

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/名称/) as HTMLInputElement
        expect(nameInput.value).toBe('テスト活動地1')
      })

      const activitiesInput = screen.getByLabelText(/活動内容/) as HTMLTextAreaElement
      expect(activitiesInput.value).toBe('毎週日曜日に活動しています')

      const addressInput = document.getElementById('address') as HTMLInputElement
      expect(addressInput.value).toBe('大阪府大阪市')
    })

    it('更新に成功する', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminLocationFetch.updateLocationWithFiles).mockResolvedValue({
        success: true,
        data: mockLocationData
      })

      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('更新する')).toBeInTheDocument()
      })

      const activitiesInput = screen.getByLabelText(/活動内容/) as HTMLTextAreaElement
      await user.clear(activitiesInput)
      await user.type(activitiesInput, '毎週土曜日に活動しています')

      const submitButton = screen.getByText('更新する')
      await user.click(submitButton)

      await waitFor(() => {
        expect(AdminLocationFetch.updateLocationWithFiles).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('活動地を更新しました')).toBeInTheDocument()
      })
    })

    it('既存のギャラリー画像が表示される', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByAltText('写真1')).toBeInTheDocument()
        expect(screen.getByAltText('写真2')).toBeInTheDocument()
      })
    })

    it('既存の添付ファイルが表示される', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/資料1\.pdf/)).toBeInTheDocument()
        expect(screen.getByText(/資料2\.pdf/)).toBeInTheDocument()
      })
    })
  })

  describe('ファイルアップロード', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: false,
        message: 'Not found'
      })
    })

    it('メイン画像を選択できる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' })
      const imageInput = screen.getByLabelText(/メイン画像/) as HTMLInputElement

      await user.upload(imageInput, file)

      await waitFor(() => {
        expect(imageInput.files?.[0]).toBe(file)
      })
    })

    it('ファイルサイズが大きすぎる場合、エラーメッセージが表示される', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 10MB の大きいファイル
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-image.jpg', {
        type: 'image/jpeg'
      })
      const imageInput = screen.getByLabelText(/メイン画像/) as HTMLInputElement

      await user.upload(imageInput, largeFile)

      await waitFor(() => {
        expect(screen.getByText(/画像ファイルサイズが大きすぎます/)).toBeInTheDocument()
      })
    })
  })

  describe('フォーム操作', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: false,
        message: 'Not found'
      })
    })

    it('閉じるボタンで onClose が呼ばれる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 閉じるボタン（X）をクリック
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find((btn) =>
        btn.querySelector('svg')?.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
      )

      if (closeButton) {
        await user.click(closeButton)
        expect(mockOnClose).toHaveBeenCalled()
      }
    })

    it('登録成功後、閉じるボタンで onSuccess が呼ばれる', async () => {
      const user = userEvent.setup()
      vi.mocked(AdminLocationFetch.createLocationWithFiles).mockResolvedValue({
        success: true,
        data: {
          id: 'test-location-1',
          name: 'テスト活動地1',
          position: [35.0, 135.0],
          type: 'regular'
        }
      })

      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 登録ボタンをクリック
      const submitButton = screen.getByText('登録する')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('活動地を登録しました')).toBeInTheDocument()
      })

      // 閉じるボタンをクリック
      const closeButton = screen.getByText('閉じる')
      await user.click(closeButton)

      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('型選択ができる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      const typeSelect = screen.getByLabelText(/タイプ/) as HTMLSelectElement
      await user.selectOptions(typeSelect, 'meeting')

      expect(typeSelect.value).toBe('meeting')
    })

    it('詳細情報あり/なしを切り替えられる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      // 実際のラベルテキストに基づいて取得
      const hasDetailCheckbox = screen.getByRole('checkbox', { name: /詳細/ }) as HTMLInputElement
      expect(hasDetailCheckbox.checked).toBe(false)

      await user.click(hasDetailCheckbox)
      expect(hasDetailCheckbox.checked).toBe(true)
    })

    it('下書きフラグを切り替えられる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      const isDraftCheckbox = screen.getByRole('checkbox', { name: /下書き/ }) as HTMLInputElement
      expect(isDraftCheckbox.checked).toBe(false)

      await user.click(isDraftCheckbox)
      expect(isDraftCheckbox.checked).toBe(true)
    })
  })

  describe('ギャラリー画像の操作', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: true,
        data: {
          id: 'test-location-1',
          name: 'テスト活動地1',
          position: [35.0, 135.0],
          type: 'regular',
          hasDetail: false,
          status: 'published',
          gallery: [
            {
              filename: 'gallery1.jpg',
              url: '/uploads/locations/gallery1.jpg',
              caption: '写真1'
            }
          ]
        }
      })
    })

    it('既存の画像を削除できる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByAltText('写真1')).toBeInTheDocument()
      })

      // 削除ボタンを探してクリック
      const deleteButtons = screen.getAllByRole('button')
      const imageDeleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg')
        return svg && btn.closest('div')?.querySelector('img[alt="写真1"]')
      })

      if (imageDeleteButton) {
        await user.click(imageDeleteButton)

        await waitFor(() => {
          expect(screen.queryByAltText('写真1')).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('添付ファイルの操作', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: true,
        data: {
          id: 'test-location-1',
          name: 'テスト活動地1',
          position: [35.0, 135.0],
          type: 'regular',
          hasDetail: false,
          status: 'published',
          attachments: [{ name: '資料1.pdf', filename: 'doc1.pdf', size: 1024 }]
        }
      })
    })

    it('既存の添付ファイルを削除できる', async () => {
      const user = userEvent.setup()
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/資料1\.pdf/)).toBeInTheDocument()
      })

      // 削除ボタンを探してクリック
      const deleteButtons = screen.getAllByRole('button')
      const attachmentDeleteButton = deleteButtons.find((btn) => {
        const svg = btn.querySelector('svg')
        return svg && btn.closest('div')?.querySelector('a[href*="doc1.pdf"]')
      })

      if (attachmentDeleteButton) {
        await user.click(attachmentDeleteButton)

        await waitFor(() => {
          expect(screen.queryByText(/資料1\.pdf/)).not.toBeInTheDocument()
        })
      }
    })
  })

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      vi.mocked(AdminLocationFetch.getLocationById).mockResolvedValue({
        success: false,
        message: 'Not found'
      })
    })

    it('フォームの全ての入力欄にラベルが紐付けられている', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      const idInput = screen.getByLabelText(/ID/)
      expect(idInput).toBeInTheDocument()

      const nameInput = screen.getByLabelText(/名称/)
      expect(nameInput).toBeInTheDocument()

      const latInput = screen.getByLabelText(/緯度/)
      expect(latInput).toBeInTheDocument()

      const lngInput = screen.getByLabelText(/経度/)
      expect(lngInput).toBeInTheDocument()
    })

    it('必須フィールドに * マークが表示される', async () => {
      render(<LocationModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.queryByText(/読み込み中/i)).not.toBeInTheDocument()
      })

      const requiredMarks = screen.getAllByText('*')
      expect(requiredMarks.length).toBeGreaterThan(0)
    })
  })
})
