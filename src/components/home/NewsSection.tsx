import newsPriority from '@/config/news-priority.json'
import NewsFetch from '@/fetch/news'
import useSWR from '@/hooks/swr'
import { getConfig } from '@/types/config'
import type { News, NewsAttachment } from '@/types/news'
import React from 'react'

const NewsSection: React.FC = () => {
  // 設定から表示件数を取得
  const config = getConfig()
  const itemsPerPage = config.home.news.itemsPerPage

  // 最新のお知らせを取得
  const {
    data: latestNews,
    error,
    isLoading
  } = useSWR(`latest-news-${itemsPerPage}`, () => NewsFetch.getLatestNews(itemsPerPage))

  // 日付をフォーマットする関数
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}/${day}`
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

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">お知らせ</h2>
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-start justify-between">
              <div className="flex min-w-0 flex-1 items-start">
                <div className="mr-4 h-4 w-12 flex-shrink-0 animate-pulse rounded bg-gray-200"></div>
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-200"></div>
              </div>
              <div className="ml-2 h-6 w-12 flex-shrink-0 animate-pulse rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !latestNews || latestNews.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">お知らせ</h2>
          <a
            href="/news"
            className="text-primary-600 hover:text-primary-700 cursor-pointer drop-shadow-sm transition-all duration-200 hover:scale-110"
            title="お知らせを見る"
          >
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
          </a>
        </div>
        <div className="text-center text-gray-500">
          <p>お知らせがありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">お知らせ</h2>
        <a
          href="/news"
          className="text-primary-600 hover:text-primary-700 cursor-pointer drop-shadow-sm transition-all duration-200 hover:scale-110"
          title="お知らせを見る"
        >
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            ></path>
          </svg>
        </a>
      </div>
      <ul className="space-y-4">
        {latestNews.map((news) => (
          <li key={news.id} className="flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start">
              <span className="text-primary-600 mr-4 flex-shrink-0 font-bold">
                {formatDate(news.date)}
              </span>
              <span className="truncate">{news.title}</span>
            </div>
            {news.priority && (
              <span
                className="ml-2 flex-shrink-0 rounded px-2 py-1 text-xs font-bold text-white"
                style={{
                  backgroundColor: getPriorityColor(news.priority)
                }}
              >
                {getPriorityName(news.priority)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NewsSection
