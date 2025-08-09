import NewsModal from '@/components/news/NewsModal'
import { modalNewsId, showNewsModal } from '@/store/news'
import { useStore } from '@nanostores/react'
import React from 'react'
import { createPortal } from 'react-dom'

const NewsModalLink: React.FC = () => {
  const isModalVisible = useStore(showNewsModal)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // お知らせIDを設定し、モーダルを表示
    modalNewsId.set(0)
    showNewsModal.set(true)
  }

  const handleClose = () => {
    // モーダルを非表示
    showNewsModal.set(false)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="hover:bg-primary-600 flex w-full items-center px-4 py-2 text-white"
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        お知らせを追加
      </button>
      {isModalVisible && createPortal(<NewsModal onClose={handleClose} />, document.body)}
    </>
  )
}

export default NewsModalLink
