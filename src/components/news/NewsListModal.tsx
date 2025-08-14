import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import NewsModal from '@/components/news/NewsModal'
import AdminNewsFetch from '@/fetch/admin/news'
import type { News } from '@/types/news'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// AdminNewsFetchのNewsResponse型を定義
interface NewsResponse {
  success: boolean
  data: {
    news: News[]
    pagination: {
      currentPage: number
      itemsPerPage: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
  error?: string
}

interface NewsListModalProps {
  isOpen: boolean
  onClose: () => void
}

const NewsListModal: React.FC<NewsListModalProps> = ({ isOpen, onClose }) => {
  const [newsList, setNewsList] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [showNewsModal, setShowNewsModal] = useState(false)

  // お知らせ一覧を取得（フロントエンドで表示されない項目のみ）
  const fetchNewsList = async (page: number = 1) => {
    setLoading(true)
    setError('')
    try {
      const response: NewsResponse = await AdminNewsFetch.getNews(page, 100) // 多めに取得してフィルタリング

      // フロントエンドで表示されない項目のみをフィルタリング
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 今日の23:59:59まで

      const hiddenNews = response.data.news.filter((news) => {
        const newsDate = new Date(news.date)
        // 未来の日付 または 非公開のお知らせのみ表示
        return newsDate > today || news.status !== 'published'
      })

      setNewsList(hiddenNews)
      // 簡易的なページネーション（フィルタリング後のデータ用）
      setTotalPages(Math.ceil(hiddenNews.length / 20))
      setCurrentPage(1) // 常に1ページ目を表示
    } catch (err) {
      setError(err instanceof Error ? err.message : 'お知らせの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // モーダルが開かれた時に一覧を取得
  useEffect(() => {
    if (isOpen) {
      void fetchNewsList(1)
    }
  }, [isOpen])

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

  // 削除処理
  const handleDelete = async (newsId: number, title: string) => {
    if (!confirm(`「${title}」を削除しますか？\n\nこの操作は取り消しできません。`)) {
      return
    }

    setIsDeleting(newsId)
    try {
      await AdminNewsFetch.deleteNews(newsId)
      void fetchNewsList(currentPage) // 一覧を再取得
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集処理
  const handleEdit = (news: News) => {
    setEditingNews(news)
    setShowNewsModal(true)
  }

  // お知らせモーダルを閉じる
  const handleNewsModalClose = () => {
    setShowNewsModal(false)
    setEditingNews(null)
  }

  // お知らせモーダルでの成功処理
  const handleNewsModalSuccess = () => {
    setShowNewsModal(false)
    setEditingNews(null)
    void fetchNewsList(currentPage) // 一覧を再取得
  }

  // ページ変更
  const handlePageChange = (page: number) => {
    void fetchNewsList(page)
  }

  // 日付フォーマット
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, 'yyyy年MM月dd日', { locale: ja })
  }

  // 未来の日付かどうかチェック
  const isFutureDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dateObj.setHours(0, 0, 0, 0)
    return dateObj > today
  }

  // 非公開かどうかチェック
  const isUnpublished = (status: string) => {
    return status !== 'published'
  }

  // ステータスバッジを取得
  const getStatusBadge = (news: News) => {
    if (isUnpublished(news.status)) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          非公開
        </span>
      )
    }
    if (isFutureDate(news.date)) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
          予約投稿
        </span>
      )
    }
    return null
  }

  // NewsModal用のデータ変換
  const convertToNewsModalData = (news: News) => {
    return {
      title: news.title,
      content: news.content,
      date: typeof news.date === 'string' ? new Date(news.date) : news.date,
      categories: news.categories || [],
      priority: news.priority || null,
      attachments: news.attachments || [],
      id: news.id.toString()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50">
      <div className="relative mx-4 flex h-[90vh] max-h-[800px] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* ヘッダー（NewsModalに合わせる） */}
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
          <h2 className="mb-1 text-3xl font-bold text-gray-900">お知らせ管理</h2>
          <p className="mb-4 text-gray-600">非公開・未来の日付のお知らせを管理できます</p>
        </div>

        {/* メッセージ表示エリア */}
        {error && (
          <div className="flex-shrink-0 px-6 pt-4">
            <Alert message={error} type="error" />
          </div>
        )}

        {/* コンテンツエリア（NewsModalに合わせる余白） */}
        <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                  <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !border-0 !p-0 !whitespace-nowrap ![clip:rect(0,0,0,0)]">
                    読み込み中...
                  </span>
                </div>
                <p className="mt-2 text-gray-600">データを読み込み中...</p>
              </div>
            </div>
          ) : newsList.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">管理対象のお知らせがありません</p>
              <p className="mt-1 text-sm text-gray-400">
                非公開または未来の日付のお知らせはありません
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {newsList.map((news) => (
                <div
                  key={news.id}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    isUnpublished(news.status)
                      ? 'border-red-200 bg-red-50'
                      : isFutureDate(news.date)
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  {/* タイトルと日付 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-gray-900">{news.title}</h3>
                    </div>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                      {getStatusBadge(news)}
                      <span>公開日: {formatDate(news.date)}</span>
                    </p>
                  </div>

                  {/* 編集・削除ボタン */}
                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="info"
                      size="md"
                      onClick={() => handleEdit(news)}
                      disabled={isDeleting === news.id}
                      icon="mdi:pencil"
                      text="編集"
                      title="編集"
                    />
                    <Button
                      variant="error"
                      size="md"
                      onClick={() => handleDelete(news.id, news.title)}
                      disabled={isDeleting === news.id}
                      icon={isDeleting === news.id ? 'mdi:loading' : 'mdi:delete'}
                      text="削除"
                      title="削除"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ページネーション（NewsModalに合わせてボーダー無し） */}
        {!loading && totalPages > 1 && (
          <div className="px-6 pb-2">
            <div className="flex items-center justify-center space-x-2">
              <Button
                type="button"
                variant="default"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-sm"
              >
                前へ
              </Button>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages} ページ
              </span>
              <Button
                type="button"
                variant="default"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-sm"
              >
                次へ
              </Button>
            </div>
          </div>
        )}

        {/* フッター（NewsModalに合わせる） */}
        <div className="px-6 pt-0 pb-6">
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="default" onClick={onClose}>
              閉じる
            </Button>
          </div>
        </div>
      </div>

      {/* お知らせ編集モーダル */}
      {showNewsModal && editingNews && (
        <NewsModal
          onClose={handleNewsModalClose}
          onSuccess={handleNewsModalSuccess}
          news={convertToNewsModalData(editingNews)}
          isEditMode={true}
        />
      )}
    </div>,
    document.body
  )
}

export default NewsListModal
