import eventFetch from '@/fetch/event'
import { getConfig } from '@/types/config'
import React, { useEffect, useState } from 'react'

interface Event {
  id: number
  title: string
  start: string
  end: string
  isAllDay: boolean
  categoryId: string
  commentCount: number
}

const UpcomingEvents: React.FC = () => {
  // 設定から表示件数を取得
  const config = getConfig()
  const itemsPerPage = config.home.events.itemsPerPage

  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        //const data = await eventFetch.getUpcomingEvents(itemsPerPage)
        const response = await eventFetch.getUpcomingEvents(itemsPerPage)
        if (!response.ok) {
          const errorData = await response.json()
          setError(`データの取得に失敗しました: ${errorData.message}`)
          return
        }
        const data: Event[] = await response.json()
        setEvents(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    void fetchEvents()
  }, [itemsPerPage])

  // 日付をフォーマットする関数
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">最新の活動予定</h2>
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="mr-4 h-4 w-12 animate-pulse rounded bg-gray-200"></div>
              <div className="h-4 flex-1 animate-pulse rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">最新の活動予定</h2>
          <a
            href="/calendar"
            className="text-primary-600 hover:text-primary-700 cursor-pointer drop-shadow-sm transition-all duration-200 hover:scale-110"
            title="活動予定を見る"
          >
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">最新の活動予定</h2>
        <a
          href="/calendar"
          className="text-primary-600 hover:text-primary-700 cursor-pointer drop-shadow-sm transition-all duration-200 hover:scale-110"
          title="活動予定を見る"
        >
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
      <ul className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <li key={event.id} className="flex items-center">
              <span className="text-primary-600 mr-4 font-bold">
                {formatEventDate(event.start)}
              </span>
              <span>{event.title}</span>
            </li>
          ))
        ) : (
          <li className="flex items-center justify-center py-4">
            <span className="text-gray-500">予定されている活動はありません</span>
          </li>
        )}
      </ul>
    </div>
  )
}

export default UpcomingEvents
