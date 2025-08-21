import Button from '@/components/base/Button'
import Pagination from '@/components/base/Pagination'
import NewsModal from '@/components/news/NewsModal'
import newsCategories from '@/config/news-category.json'
import newsPriority from '@/config/news-priority.json'
import AdminNewsFetch from '@/fetch/admin/news'
import NewsFetch from '@/fetch/news'
import useSWR from '@/hooks/swr'
import { userStore } from '@/store/user'
import { getConfig } from '@/types/config'
import type { News, PublicNews } from '@/types/news'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const NewsList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [isFilterLoading, setIsFilterLoading] = useState(false) // フィルタ専用のローディング状態
  const [editingNews, setEditingNews] = useState<News | PublicNews | null>(null)
  const [showNewsModal, setShowNewsModal] = useState(false)

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const itemsPerPage = config.pagination.newsList.itemsPerPage

  // 管理権限をチェック
  const hasAdminRole =
    user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'EDITOR'

  // SWRでデータを取得（カテゴリーフィルター対応）
  const { data, error, isLoading, mutate } = useSWR(
    `news-${currentPage}-${itemsPerPage}-${selectedCategory || 'all'}-${selectedPriority || 'all'}-${hasAdminRole ? 'admin' : 'public'}`,
    () =>
      hasAdminRole
        ? AdminNewsFetch.getNews(
            currentPage,
            itemsPerPage,
            selectedCategory || undefined,
            selectedPriority || undefined
          )
        : NewsFetch.getNews(
            currentPage,
            itemsPerPage,
            selectedCategory || undefined,
            selectedPriority || undefined
          ),
    {
      // フィルタ変更時のちらつきを防ぐ設定
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true, // 前のデータを保持
      dedupingInterval: 1000 // 重複リクエストを防ぐ
    }
  )

  // カテゴリーIDから日本語名に変換する関数
  const getCategoryName = (categoryId: string): string => {
    const category = newsCategories.find((cat) => cat.value === categoryId)
    return category ? category.name : categoryId
  }

  // カテゴリーIDからカラーを取得する関数
  const getCategoryColor = (categoryId: string): string => {
    const category = newsCategories.find((cat) => cat.value === categoryId)
    return category ? category.color : '#6B7280' // デフォルトカラー
  }

  // 優先度からカラーを取得する関数
  const getPriorityColor = (priority: string): string => {
    const priorityConfig = newsPriority.find((p) => p.value === priority)
    return priorityConfig ? priorityConfig.color : '#6B7280' // デフォルトカラー
  }

  // 優先度から日本語名を取得する関数
  const getPriorityName = (priority: string): string => {
    const priorityConfig = newsPriority.find((p) => p.value === priority)
    return priorityConfig ? priorityConfig.name : priority
  }

  // カテゴリーをクリックした時の処理
  const handleCategoryClick = async (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId
    setSelectedCategory(newCategory)
    setSelectedPriority(null) // 優先度をリセット
    setCurrentPage(1) // フィルタ変更時は最初のページに戻る

    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // フィルタ専用のローディング状態を設定
    setIsFilterLoading(true)

    // データを再取得
    try {
      await mutate()
    } finally {
      setIsFilterLoading(false)
    }
  }

  // 優先度をクリックした時の処理
  const handlePriorityClick = async (priorityId: string) => {
    const newPriority = selectedPriority === priorityId ? null : priorityId
    setSelectedPriority(newPriority)
    setSelectedCategory(null) // カテゴリーをリセット
    setCurrentPage(1) // フィルタ変更時は最初のページに戻る

    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // フィルタ専用のローディング状態を設定
    setIsFilterLoading(true)

    // データを再取得
    try {
      await mutate()
    } finally {
      setIsFilterLoading(false)
    }
  }

  // フィルタをリセット
  const handleResetFilter = async () => {
    setSelectedCategory(null)
    setSelectedPriority(null)
    setCurrentPage(1)

    // ページの上部にスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // フィルタ専用のローディング状態を設定
    setIsFilterLoading(true)

    // データを再取得
    try {
      await mutate()
    } finally {
      setIsFilterLoading(false)
    }
  }

  // 編集・削除ボタンの表示条件をチェック
  const canEditNews = (newsItem: News | PublicNews): boolean => {
    if (!user) return false

    // PublicNews型の場合は編集不可（管理者情報が含まれていない）
    if (!('creator' in newsItem) || !('createdAt' in newsItem)) {
      return false
    }

    // ADMIN、MODERATORは常に編集可能
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      return true
    }

    // EDITORは自分のお知らせのみ編集可能
    if (user.role === 'EDITOR') {
      if (newsItem.creator.id === user.id) {
        return true
      }
    }

    return false
  }

  // 削除処理
  const handleDelete = async (newsId: number) => {
    if (!confirm('このお知らせを削除しますか？')) {
      return
    }

    setIsDeleting(newsId)
    try {
      await AdminNewsFetch.deleteNews(newsId)
      await mutate() // データを再取得
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集処理
  const handleEdit = (news: News | PublicNews) => {
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
    void mutate() // データを再取得
  }

  // NewsModal用のデータ変換
  const convertToNewsModalData = (news: News | PublicNews) => {
    return {
      title: news.title,
      content: news.content,
      date: typeof news.date === 'string' ? new Date(news.date) : news.date,
      categories: news.categories || [],
      priority: news.priority || null,
      isMemberOnly: news.isMemberOnly || false,
      author: news.author,
      attachments: news.attachments || [],
      id: news.id.toString()
    }
  }

  // ローディング中（初回読み込み時のみ）
  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラーの場合
  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <p className="text-lg text-red-500">お知らせの読み込みに失敗しました</p>
        </div>
      </div>
    )
  }

  // データがない場合
  if (!data || !data.success || !data.data) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">お知らせデータを取得できませんでした</p>
        </div>
      </div>
    )
  }

  const { news, pagination } = data.data
  const totalPages = pagination.totalPages

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">お知らせ</h1>

      {/* フィルター */}
      <div className="mb-8">
        {/* フィルタローディングインジケーター */}
        {isFilterLoading && (
          <div className="mb-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="border-t-primary-600 h-4 w-4 animate-spin rounded-full border-2 border-gray-300"></div>
              <span>フィルタ適用中...</span>
            </div>
          </div>
        )}

        {/* デスクトップ表示: カテゴリーと優先度を縦並び */}
        <div className="hidden lg:block">
          {/* カテゴリーフィルター */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetFilter}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedCategory === null && selectedPriority === null
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                すべて
              </button>
              {newsCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  disabled={isFilterLoading}
                  className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedCategory === category.value ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor:
                      selectedCategory === category.value ? category.color : `${category.color}20`,
                    color: selectedCategory === category.value ? 'white' : category.color,
                    border: `1px solid ${category.color}`
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 優先度フィルター */}
          <div>
            <div className="flex flex-wrap gap-2">
              {newsPriority.map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => handlePriorityClick(priority.value)}
                  disabled={isFilterLoading}
                  className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedPriority === priority.value ? 'text-white' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor:
                      selectedPriority === priority.value ? priority.color : `${priority.color}20`,
                    color: selectedPriority === priority.value ? 'white' : priority.color,
                    border: `1px solid ${priority.color}`
                  }}
                >
                  {priority.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* モバイル・タブレット表示: カテゴリーと優先度を1行に横並び */}
        <div className="lg:hidden">
          <div className="flex flex-wrap gap-2">
            {/* すべてボタン */}
            <button
              onClick={handleResetFilter}
              disabled={isFilterLoading}
              className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                selectedCategory === null && selectedPriority === null
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              すべて
            </button>

            {/* カテゴリーボタン */}
            {newsCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryClick(category.value)}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedCategory === category.value ? 'text-white' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor:
                    selectedCategory === category.value ? category.color : `${category.color}20`,
                  color: selectedCategory === category.value ? 'white' : category.color,
                  border: `1px solid ${category.color}`
                }}
              >
                {category.name}
              </button>
            ))}

            {/* 優先度ボタン */}
            {newsPriority.map((priority) => (
              <button
                key={priority.value}
                onClick={() => handlePriorityClick(priority.value)}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedPriority === priority.value ? 'text-white' : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor:
                    selectedPriority === priority.value ? priority.color : `${priority.color}20`,
                  color: selectedPriority === priority.value ? 'white' : priority.color,
                  border: `1px solid ${priority.color}`
                }}
              >
                {priority.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* お知らせ一覧 */}
      {news.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">
            {selectedCategory || selectedPriority
              ? `${selectedCategory ? getCategoryName(selectedCategory) : ''}${selectedCategory && selectedPriority ? '・' : ''}${selectedPriority ? getPriorityName(selectedPriority) : ''}のお知らせがありません`
              : 'まだお知らせがありません'}
          </p>
        </div>
      ) : (
        <section className="mb-12">
          <div className="space-y-8">
            {news.map((newsItem: News | PublicNews) => (
              <article key={newsItem.id} className="overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      {/* 日付 */}
                      <div className="flex items-center text-base text-gray-500">
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(newsItem.date).toLocaleDateString('ja-JP')}
                      </div>

                      {/* カテゴリー */}
                      <div className="flex items-center space-x-2">
                        {newsItem.categories && newsItem.categories.length > 0 ? (
                          newsItem.categories.map((category, index) => (
                            <button
                              key={index}
                              onClick={() => handleCategoryClick(category)}
                              className="cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
                              style={{
                                backgroundColor: `${getCategoryColor(category)}20`,
                                color: getCategoryColor(category),
                                border: `1px solid ${getCategoryColor(category)}`
                              }}
                            >
                              {getCategoryName(category)}
                            </button>
                          ))
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                            未分類
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* 会員限定 */}
                      {user && newsItem.isMemberOnly && (
                        <span className="rounded border border-orange-500 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                          会員限定
                        </span>
                      )}

                      {/* 優先度 */}
                      {newsItem.priority && (
                        <button
                          onClick={() => handlePriorityClick(newsItem.priority!)}
                          className="cursor-pointer rounded px-3 py-1 text-sm font-bold text-white transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: getPriorityColor(newsItem.priority)
                          }}
                        >
                          {getPriorityName(newsItem.priority)}
                        </button>
                      )}

                      {/* 編集・削除ボタン */}
                      {canEditNews(newsItem) && (
                        <div className="flex gap-2">
                          <Button
                            variant="info"
                            size="md"
                            onClick={() => handleEdit(newsItem)}
                            icon="mdi:pencil"
                            text="編集"
                            title="編集"
                          />
                          <Button
                            variant="error"
                            size="md"
                            onClick={() => handleDelete(newsItem.id)}
                            disabled={isDeleting === newsItem.id}
                            icon={isDeleting === newsItem.id ? 'mdi:loading' : 'mdi:delete'}
                            text="削除"
                            title="削除"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* タイトル */}
                    <h2 className="text-2xl font-bold text-gray-800">{newsItem.title}</h2>

                    {/* 内容 */}
                    <div className="prose prose-gray prose-p:my-2 prose-h1:text-lg prose-h2:text-lg prose-h2:mb-1 prose-h2:mt-1 prose-h3:text-base prose-li:my-0.5 prose-ul:mt-1 prose-ul:mb-2 prose-ol:mt-1 prose-ol:mb-2 max-w-none text-base leading-relaxed text-gray-600">
                      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                        {newsItem.content}
                      </ReactMarkdown>
                    </div>

                    {/* 添付ファイル */}
                    {newsItem.attachments && newsItem.attachments.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-base font-semibold text-gray-700">
                          添付ファイル:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {newsItem.attachments.map((file, index) => {
                            // 管理者権限がある場合、downloadStatsからダウンロード数を取得
                            const downloadCount =
                              hasAdminRole && 'downloadStats' in newsItem
                                ? (newsItem as News).downloadStats?.[file.filename]?.count || 0
                                : null

                            return (
                              <a
                                key={index}
                                href={`/api/news/download/${newsItem.id}/${file.filename}`}
                                className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-base text-blue-700 transition-colors hover:bg-blue-100"
                                target="_blank"
                                rel="noopener noreferrer"
                                download={file.originalName}
                              >
                                <i className="fas fa-file-alt mr-2"></i>
                                {file.originalName}
                                {downloadCount !== null && (
                                  <span className="ml-1 text-gray-500">({downloadCount})</span>
                                )}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* 作成者 */}
                    <div className="flex items-center border-t border-gray-100 pt-4">
                      <div className="flex items-center text-base text-gray-500">
                        <i className="fas fa-user mr-2"></i>
                        {newsItem.author}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={pagination?.totalCount || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page)
              // ページの先頭にスクロール
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* お知らせ編集モーダル */}
      {showNewsModal && editingNews && (
        <NewsModal
          onClose={handleNewsModalClose}
          onSuccess={handleNewsModalSuccess}
          news={convertToNewsModalData(editingNews)}
          isEditMode={true}
        />
      )}
    </div>
  )
}

export default NewsList
