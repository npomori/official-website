import Pagination from '@/components/base/Pagination'
import ArticleFetch from '@/fetch/article'
import useSWR from '@/hooks/swr'
import { userStore } from '@/store/user'
import type { Article } from '@/types/article'
import { getConfig } from '@/types/config'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useState } from 'react'
import Button from '../base/Button'

const ArticleList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFilterLoading, setIsFilterLoading] = useState(false)

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const itemsPerPage = config.pagination?.articleList?.itemsPerPage || 10

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
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      keepPreviousData: true,
      dedupingInterval: 1000
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
  }

  // フィルタをリセット
  const handleResetFilters = () => {
    setSelectedCategory(null)
    setSelectedTags([])
    setCurrentPage(1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsFilterLoading(true)
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

  // ローディング状態
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">記事の読み込みに失敗しました</div>
        <Button onClick={() => mutate()} className="bg-green-600 text-white hover:bg-green-700">
          再試行
        </Button>
      </div>
    )
  }

  // データが存在しない場合の処理
  if (!data || !data.success) {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-lg text-red-600">
          {data?.message || '記事の読み込みに失敗しました'}
        </div>
        <Button onClick={() => mutate()} className="bg-green-600 text-white hover:bg-green-700">
          再試行
        </Button>
      </div>
    )
  }

  const articles = data.data?.articles || []
  const pagination = data.data?.pagination

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">記事一覧</h1>
      </div>

      {/* フィルター */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* カテゴリーフィルター */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">カテゴリー:</span>
            {['自然保護', '環境活動', 'イベント', 'レポート', 'その他'].map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* タグフィルター */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">タグ:</span>
            {['植林', '調査', '保全', '教育', '研究'].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* リセットボタン */}
          {(selectedCategory || selectedTags.length > 0) && (
            <button
              onClick={handleResetFilters}
              className="rounded bg-gray-500 px-3 py-1 text-sm text-white transition-colors hover:bg-gray-600"
            >
              フィルターリセット
            </button>
          )}
        </div>
      </div>

      {/* 記事一覧 */}
      {isFilterLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
      )}

      {!isFilterLoading && articles.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mb-4 text-lg text-gray-500">条件に一致する記事が見つかりませんでした</div>
          <Button
            onClick={handleResetFilters}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            フィルターをリセット
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article
              key={article.id}
              className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                {/* タイトル */}
                <h2 className="text-lg font-semibold text-gray-900 transition-colors hover:text-green-600">
                  <a href={`/articles/${article.slug}`} className="block">
                    {article.title}
                  </a>
                </h2>

                {/* 日付 */}
                <div className="ml-4 text-sm whitespace-nowrap text-gray-500">
                  {formatDate(article.publishedAt || article.createdAt)}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-12">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
            totalCount={pagination.totalCount}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      )}
    </div>
  )
}

export default ArticleList
