import Button from '@/components/base/Button'
import locationOptions from '@/config/location.json'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface LocationSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (locationId: string) => void
}

const LocationSelectModal: React.FC<LocationSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50">
      <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* ヘッダー */}
        <div className="relative px-6 pt-6">
          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full bg-gray-500 p-2 text-white transition-all hover:bg-gray-600"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="mb-1 text-3xl font-bold text-gray-900">活動地を選択</h2>
          <p className="mb-4 text-gray-600">編集する活動地を選択してください</p>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6">
          <div className="space-y-2">
            {locationOptions.map((location) => (
              <button
                key={location.value}
                onClick={() => {
                  onSelect(location.value)
                  onClose()
                }}
                className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50"
              >
                <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                <p className="text-sm text-gray-500">ID: {location.value}</p>
              </button>
            ))}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 pt-0 pb-6">
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="default" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default LocationSelectModal
