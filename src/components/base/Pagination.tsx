import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
  showPageInfo?: boolean
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  maxVisiblePages = 7,
  showPageInfo = true
}) => {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)

  const renderPageNumbers = () => {
    const pages = []
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // 表示範囲を調整
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // 最初のページ
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300"
          onClick={() => onPageChange(1)}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 py-2 text-gray-500">
            ...
          </span>
        )
      }
    }

    // 表示範囲のページ
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`rounded px-3 py-2 ${
            currentPage === i
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      )
    }

    // 最後のページ
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 py-2 text-gray-500">
            ...
          </span>
        )
      }
      pages.push(
        <button
          key={totalPages}
          className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300"
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      )
    }

    return pages
  }

  return (
    <div className="mt-12">
      {/* ページ情報表示 */}
      {showPageInfo && (
        <div className="mb-4 text-center text-gray-600">
          {totalCount}件中 {startItem} - {endItem}件を表示
        </div>
      )}

      <div className="flex justify-center">
        <nav className="flex items-center space-x-1">
          {/* 最初のページへ */}
          <button
            className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            title="最初のページへ"
          >
            <i className="fas fa-angle-double-left"></i>
          </button>

          {/* 前のページへ */}
          <button
            className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            title="前のページへ"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          {/* ページ番号 */}
          {renderPageNumbers()}

          {/* 次のページへ */}
          <button
            className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            title="次のページへ"
          >
            <i className="fas fa-chevron-right"></i>
          </button>

          {/* 最後のページへ */}
          <button
            className="rounded bg-gray-200 px-3 py-2 text-gray-600 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            title="最後のページへ"
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default Pagination
