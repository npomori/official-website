import NewsListModal from '@/components/news/NewsListModal'
import { useState } from 'react'

const NewsListModalLink: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsModalVisible(true)
  }

  const handleClose = () => {
    setIsModalVisible(false)
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        非公開・予約投稿
      </button>
      <NewsListModal isOpen={isModalVisible} onClose={handleClose} />
    </>
  )
}

export default NewsListModalLink
