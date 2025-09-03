import EventModal from '@/components/event/EventModal'
import { modalEventId, showEventModal } from '@/store/event'
import { useStore } from '@nanostores/react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const EventModalLink: React.FC = () => {
  const isModalVisible = useStore(showEventModal)

  const handleClick = () => {
    // メニューを非表示にする
    const dropdown = document.getElementById('dropdownNavbar')
    if (dropdown) {
      dropdown.style.visibility = 'hidden'
    }

    // イベントIDを設定し、モーダルを表示
    modalEventId.set(0)
    showEventModal.set(true)
  }

  const handleClose = () => {
    // モーダルを非表示
    showEventModal.set(false)

    // メニューの状態を元に戻す
    const dropdown = document.getElementById('dropdownNavbar')
    if (dropdown) {
      dropdown.style.visibility = 'visible'
    }
  }

  useEffect(() => {
    // モーダルが閉じられたときにメニューを表示
    if (!isModalVisible) {
      const dropdown = document.getElementById('dropdownNavbar')
      if (dropdown) {
        dropdown.style.visibility = 'visible'
      }
    }
  }, [isModalVisible])

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
        イベントを追加
      </button>
      {isModalVisible && createPortal(<EventModal onClose={handleClose} />, document.body)}
    </>
  )
}

export default EventModalLink
