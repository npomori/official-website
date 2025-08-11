import Button from '@/components/base/Button'
import Pagination from '@/components/base/Pagination'
import NewsModalLink from '@/components/news/NewsModalLink'
import newsCategories from '@/config/news-category.json'
import newsPriority from '@/config/news-priority.json'
import newsFetch from '@/fetch/news'
import useSWR from '@/hooks/swr'
import { userStore } from '@/store/user'
import { getConfig } from '@/types/config'
import type { News, NewsAttachment } from '@/types/news'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useState } from 'react'

const NewsList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const itemsPerPage = config.pagination.newsList.itemsPerPage

  // SWRでデータを取得（カテゴリーフィルター対応）
  const { data, error, isLoading, mutate } = useSWR(
    `news-${currentPage}-${itemsPerPage}-${selectedCategory || 'all'}-${selectedPriority || 'all'}`,
    () =>
      newsFetch.getNews(
        currentPage,
        itemsPerPage,
        selectedCategory || undefined,
        selectedPriority || undefined
      )
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
  const handleCategoryClick = (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId
    setSelectedCategory(newCategory)
    setSelectedPriority(null) // 優先度をリセット
    setCurrentPage(1) // フィルタ変更時は最初のページに戻る
  }

  // 優先度をクリックした時の処理
  const handlePriorityClick = (priorityId: string) => {
    const newPriority = selectedPriority === priorityId ? null : priorityId
    setSelectedPriority(newPriority)
    setSelectedCategory(null) // カテゴリーをリセット
    setCurrentPage(1) // フィルタ変更時は最初のページに戻る
  }

  // フィルタをリセット
  const handleResetFilter = () => {
    setSelectedCategory(null)
    setSelectedPriority(null)
    setCurrentPage(1)
  }

  // 編集・削除ボタンの表示条件をチェック
  const canEditNews = (news: News): boolean => {
    if (!user) return false

    // ADMIN、MODERATORは常に編集可能
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      return true
    }

    // EDITORは自分のお知らせのみ編集可能（n日間制限付き）
    if (user.role === 'EDITOR') {
      if (news.creator.id !== user.id) {
        return false
      }

      // 作成日からn日以内の制限
      const createdAt = new Date(news.createdAt)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - createdAt.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const editDays = config.content?.news?.editDays || 7

      return diffDays <= editDays
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
      await newsFetch.deleteNews(newsId)
      await mutate() // データを再取得
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集処理
  const handleEdit = (news: News) => {
    // TODO: 編集機能は別途実装
    console.log('編集処理:', news)
  }

  // ローディング中
  if (isLoading) {
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
  if (!data || !data.success) {
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
        {/* デスクトップ表示: カテゴリーと優先度を縦並び */}
        <div className="hidden lg:block">
          {/* カテゴリーフィルター */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetFilter}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedCategory === null && selectedPriority === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              {newsCategories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => handleCategoryClick(category.value)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
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
                  className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
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
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedCategory === null && selectedPriority === null
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>

            {/* カテゴリーボタン */}
            {newsCategories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryClick(category.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
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
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
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
            {news.map((newsItem: News) => (
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
                    <div className="text-base leading-relaxed text-gray-600">
                      {newsItem.content}
                    </div>

                    {/* 添付ファイル */}
                    {newsItem.attachments && newsItem.attachments.length > 0 && (
                      <div>
                        <h4 className="mb-2 text-base font-semibold text-gray-700">
                          添付ファイル:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {newsItem.attachments.map((file, index) => (
                            <a
                              key={index}
                              href={`/api/admin/news/download/${file.serverName}`}
                              className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-base text-blue-700 transition-colors hover:bg-blue-100"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <i className="fas fa-file-alt mr-2"></i>
                              {file.originalName}
                            </a>
                          ))}
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
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}

export default NewsList
