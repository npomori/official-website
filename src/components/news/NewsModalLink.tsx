import NewsModal from '@/components/news/NewsModal'
import { useState } from 'react'
import { createPortal } from 'react-dom'

const NewsModalLink: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsModalVisible(true)
  }

  const handleClose = () => {
    setIsModalVisible(false)
  }

  const handleSuccess = () => {
    // お知らせが追加された後にページをリロード
    window.location.reload()
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
      {isModalVisible &&
        createPortal(<NewsModal onClose={handleClose} onSuccess={handleSuccess} />, document.body)}
    </>
  )
}

export default NewsModalLink
