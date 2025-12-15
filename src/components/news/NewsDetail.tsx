import Button from '@/components/base/Button'
import ContentNotFound from '@/components/ContentNotFound'
import newsCategories from '@/config/news-category.json'
import newsPriority from '@/config/news-priority.json'
import AdminNewsFetch from '@/fetch/admin/news'
import NewsFetch from '@/fetch/news'
import { formatFileSize } from '@/helpers/file'
import { userStore } from '@/store/user'
import type { News, PublicNews } from '@/types/news'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

interface NewsDetailProps {
  newsId?: string | undefined
}

const NewsDetail: React.FC<NewsDetailProps> = ({ newsId }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [news, setNews] = useState<News | PublicNews | null>(null)
  // URL から取得した ID はローカル変数で扱う（state 不要）

  const user = useStore(userStore) as UserAuth | null

  // 管理権限をチェック
  const hasAdminRole =
    user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'EDITOR'

  // ニュースデータを取得する関数
  const fetchNews = async (newsId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = hasAdminRole
        ? await AdminNewsFetch.getNewsById(parseInt(newsId))
        : await NewsFetch.getNewsById(parseInt(newsId))

      if (response.success && response.data) {
        setNews(response.data)
      } else {
        setError(response.message || 'お知らせの取得に失敗しました')
      }
    } catch (err) {
      console.error('ニュース取得エラー:', err)
      setError('お知らせの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // URLからIDを取得してニュースデータを取得
  useEffect(() => {
    if (!newsId) {
      const pathSegments = window.location.pathname.split('/')
      const newsIdFromUrl = pathSegments[pathSegments.length - 1]
      if (newsIdFromUrl) {
        void fetchNews(newsIdFromUrl)
      }
    } else {
      void fetchNews(newsId)
    }
  }, [newsId, hasAdminRole])

  // カテゴリーIDから日本語名に変換する関数
  const getCategoryName = (categoryId: string): string => {
    const category = newsCategories.find((cat) => cat.value === categoryId)
    return category ? category.name : categoryId
  }

  // カテゴリーIDからカラーを取得する関数
  const getCategoryColor = (categoryId: string): string => {
    const category = newsCategories.find((cat) => cat.value === categoryId)
    return category ? category.color : '#6B7280'
  }

  // 優先度からカラーを取得する関数
  const getPriorityColor = (priority: string): string => {
    const priorityConfig = newsPriority.find((p) => p.value === priority)
    return priorityConfig ? priorityConfig.color : '#6B7280'
  }

  // 優先度から日本語名を取得する関数
  const getPriorityName = (priority: string): string => {
    const priorityConfig = newsPriority.find((p) => p.value === priority)
    return priorityConfig ? priorityConfig.name : priority
  }

  // 日付をフォーマットする関数
  // const formatDate = (date: Date | string): string => {
  //   const d = new Date(date)
  //   return d.toLocaleDateString('ja-JP', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //     weekday: 'long'
  //   })
  // }

  // 日付と時刻をフォーマットする関数
  const formatDateTime = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ローディング状態
  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // エラー状態
  if (error || (!isLoading && !news)) {
    return (
      <ContentNotFound
        title="お知らせが見つかりません"
        className="py-20"
        secondaryHref="/"
        secondaryLabel="ホームに戻る"
        primaryHref="/news"
        primaryLabel="お知らせ一覧に戻る"
        primaryEmphasis
      />
    )
  }

  // newsがnullの場合は何も表示しない（エラー状態で既に処理済み）
  if (!news) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => (window.location.href = '/news')}
            className="flex cursor-pointer items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            お知らせ一覧に戻る
          </Button>
        </div>
      </div>

      {/* お知らせ記事 */}
      <article className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              {/* 日付 */}
              <div className="flex items-center text-base text-gray-500">
                <i className="fas fa-calendar mr-1"></i>
                {new Date(news.date).toLocaleDateString('ja-JP')}
              </div>

              {/* カテゴリー */}
              <div className="flex items-center space-x-2">
                {news.categories && news.categories.length > 0 ? (
                  news.categories.map((category, index) => (
                    <span
                      key={index}
                      className="rounded-full px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: `${getCategoryColor(category)}20`,
                        color: getCategoryColor(category),
                        border: `1px solid ${getCategoryColor(category)}`
                      }}
                    >
                      {getCategoryName(category)}
                    </span>
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
              {user && news.isMemberOnly && (
                <span className="rounded border border-orange-500 bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                  会員限定
                </span>
              )}

              {/* 優先度 */}
              {news.priority && (
                <span
                  className="rounded px-3 py-1 text-sm font-bold text-white"
                  style={{
                    backgroundColor: getPriorityColor(news.priority)
                  }}
                >
                  {getPriorityName(news.priority)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {/* タイトル */}
            <h1 className="text-2xl font-bold text-gray-800">{news.title}</h1>

            {/* 内容 */}
            <div className="prose prose-gray prose-p:my-2 prose-h1:text-lg prose-h2:text-lg prose-h2:mb-1 prose-h2:mt-1 prose-h3:text-base prose-li:my-0.5 prose-ul:mt-1 prose-ul:mb-2 prose-ol:mt-1 prose-ol:mb-2 max-w-none text-base leading-relaxed text-gray-600">
              <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {news.content}
              </ReactMarkdown>
            </div>

            {/* 添付ファイル */}
            {news.attachments && news.attachments.length > 0 && (
              <div>
                <h4 className="mb-2 text-base font-semibold text-gray-700">添付ファイル:</h4>
                <div className="flex flex-wrap gap-2">
                  {news.attachments.map((file, index) => {
                    // 管理者権限がある場合、downloadStatsからダウンロード数を取得
                    const downloadCount =
                      hasAdminRole && 'downloadStats' in news
                        ? (news as News).downloadStats?.[file.filename]?.count || 0
                        : null

                    return (
                      <a
                        key={index}
                        href={`/api/news/download/${news.id}/${file.filename}`}
                        className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-base text-blue-700 transition-colors hover:bg-blue-100"
                        target="_blank"
                        rel="noopener noreferrer"
                        download={file.name}
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        {file.name}
                        <span className="ml-2 text-sm text-gray-500">
                          ({formatFileSize(file.size)}
                          {downloadCount !== null && ` · ${downloadCount}回`})
                        </span>
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
                {news.author}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 管理情報（管理者のみ表示） */}
      {hasAdminRole && 'status' in news && (
        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">管理情報</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>作成者: {news.creator?.name || '不明'}</div>
            <div>作成日: {formatDateTime(news.createdAt)}</div>
            <div>更新日: {formatDateTime(news.updatedAt)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewsDetail
