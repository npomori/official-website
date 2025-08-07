import React, { useEffect } from 'react'

interface ImageModalProps {
  isOpen: boolean
  imageSrc: string
  imageAlt: string
  onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageSrc, imageAlt, onClose }) => {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // スクロール防止
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-5xl">
        {/* 画像コンテナ */}
        <div className="relative flex min-h-[60vh] items-center justify-center bg-transparent">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-[80vh] max-w-full bg-transparent object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white transition-colors hover:bg-black/90 focus:ring-2 focus:ring-white/50 focus:outline-none"
            aria-label="閉じる"
          >
            <span className="text-2xl leading-none font-light">×</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageModal
