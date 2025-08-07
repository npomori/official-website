import Button from '@/components/base/Button'
import React, { useState } from 'react'

const NewsModalLink: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    // ページをリロードして新しいお知らせを表示
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="hover:bg-primary-600 flex w-full items-center px-4 py-2 text-white"
      >
        <i className="fas fa-plus mr-2"></i>
        お知らせ作成
      </button>

      {/* TODO: NewsModalコンポーネントを実装 */}
      {isModalOpen && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">お知らせ作成</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p className="mb-4 text-gray-600">お知らせ作成機能は現在開発中です。</p>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={handleCloseModal} text="キャンセル" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NewsModalLink
