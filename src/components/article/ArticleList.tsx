import Button from '@/components/base/Button'
import Pagination from '@/components/base/Pagination'
import AdminArticleFetch from '@/fetch/admin/article'
import ArticleFetch from '@/fetch/article'
import useSWR from '@/hooks/swr'
import { userStore } from '@/store/user'
import type { Article } from '@/types/article'
import { getConfig } from '@/types/config'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useState } from 'react'

const ArticleList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const itemsPerPage = config.pagination?.newsList?.itemsPerPage || 10

  // 編集・削除ボタンの表示条件をチェック
  const canEditArticle = (article: Article): boolean => {
    if (!user) return false

    // ADMIN、MODERATORは常に編集可能
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      return true
    }

    // EDITORは自分の記事のみ編集可能
    if (user.role === 'EDITOR') {
      if (article.creator.id === user.id) {
        return true
      }
    }

    return false
  }

  // 削除処理
  const handleDelete = async (articleId: number) => {
    if (!confirm('この記事を削除しますか？')) {
      return
    }

    setIsDeleting(articleId)
    try {
      await AdminArticleFetch.deleteArticle(articleId)
      await mutate() // データを再取得
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集処理
  const handleEdit = (article: Article) => {
    // 今のところアラートで代用（後でモーダルを実装）
    alert(`記事「${article.title}」の編集機能は実装中です`)
  }

  // SWRでデータを取得
  const { data, error, isLoading, mutate } = useSWR(
    `articles-${currentPage}-${itemsPerPage}-${selectedCategory || 'all'}-${selectedTags.join(',') || 'all'}`,
    () =>
      ArticleFetch.getArticles(
        currentPage,
        itemsPerPage,
        selectedCategory || undefined,
        selectedTags.length > 0 ? selectedTags : undefined
      ),
    {
      // フィルタ変更時のちらつきを防ぐ設定
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true, // 前のデータを保持
      dedupingInterval: 1000 // 重複リクエストを防ぐ
    }
  )

  // カテゴリーをクリックした時の処理
  const handleCategoryClick = async (category: string) => {
    const newCategory = selectedCategory === category ? null : category
    setSelectedCategory(newCategory)
    setSelectedTags([]) // タグをリセット
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

  // タグをクリックした時の処理
  const handleTagClick = async (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]

    setSelectedTags(newTags)
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
  const handleResetFilters = async () => {
    setSelectedCategory(null)
    setSelectedTags([])
    setCurrentPage(1)
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

  // 日付をフォーマット
  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
          <p className="text-lg text-red-500">記事の読み込みに失敗しました</p>
        </div>
      </div>
    )
  }

  // データがない場合
  if (!data || !data.success || !data.data) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">記事データを取得できませんでした</p>
        </div>
      </div>
    )
  }

  const articles = data.data?.articles || []
  const pagination = data.data?.pagination

  return (
    <div className="mx-auto max-w-4xl">
      {/* ヘッダー */}
      <h1 className="mb-8 text-3xl font-bold">記事一覧</h1>

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

        {/* デスクトップ表示: カテゴリーとタグを縦並び */}
        <div className="hidden lg:block">
          {/* カテゴリーフィルター */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleResetFilters}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedCategory === null && selectedTags.length === 0
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                すべて
              </button>
              {['自然保護', '環境活動', 'イベント', 'レポート', 'その他'].map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  disabled={isFilterLoading}
                  className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white'
                      : 'border border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* タグフィルター */}
          <div>
            <div className="flex flex-wrap gap-2">
              {['植林', '調査', '保全', '教育', '研究'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  disabled={isFilterLoading}
                  className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* モバイル・タブレット表示: カテゴリーとタグを1行に横並び */}
        <div className="lg:hidden">
          <div className="flex flex-wrap gap-2">
            {/* すべてボタン */}
            <button
              onClick={handleResetFilters}
              disabled={isFilterLoading}
              className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                selectedCategory === null && selectedTags.length === 0
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              すべて
            </button>

            {/* カテゴリーボタン */}
            {['自然保護', '環境活動', 'イベント', 'レポート', 'その他'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'border border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {category}
              </button>
            ))}

            {/* タグボタン */}
            {['植林', '調査', '保全', '教育', '研究'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                disabled={isFilterLoading}
                className={`cursor-pointer rounded px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 記事一覧 */}
      {!isFilterLoading && articles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">
            {selectedCategory || selectedTags.length > 0
              ? `${selectedCategory || ''}${selectedCategory && selectedTags.length > 0 ? '・' : ''}${selectedTags.join('・') || ''}の記事が見つかりませんでした`
              : 'まだ記事がありません'}
          </p>
        </div>
      ) : (
        <section className="mb-12">
          <div className="space-y-8">
            {articles.map((article) => (
              <article key={article.id} className="overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      {/* 日付 */}
                      <div className="flex items-center text-base text-gray-500">
                        <i className="fas fa-calendar mr-1"></i>
                        {formatDate(article.publishedAt || article.createdAt)}
                      </div>

                      {/* カテゴリー（記事の場合は推測またはデフォルト） */}
                      <div className="flex items-center space-x-2">
                        <span
                          className="cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80"
                          style={{
                            backgroundColor: '#10B98120',
                            color: '#10B981',
                            border: '1px solid #10B981'
                          }}
                        >
                          記事
                        </span>
                      </div>
                    </div>

                    {/* 編集・削除ボタン */}
                    {canEditArticle(article) && (
                      <div className="flex gap-2">
                        <Button
                          variant="info"
                          size="md"
                          onClick={() => handleEdit(article)}
                          icon="mdi:pencil"
                          text="編集"
                          title="編集"
                        />
                        <Button
                          variant="error"
                          size="md"
                          onClick={() => handleDelete(article.id)}
                          disabled={isDeleting === article.id}
                          icon={isDeleting === article.id ? 'mdi:loading' : 'mdi:delete'}
                          text="削除"
                          title="削除"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* タイトル */}
                    <h2 className="cursor-pointer text-2xl font-bold text-gray-800 transition-colors hover:text-blue-600">
                      <a href={`/article/${article.id}`} className="block">
                        {article.title}
                      </a>
                    </h2>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ページネーション */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page)
              // ページの先頭にスクロール
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ArticleList
