import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import config from '@/config/config.json'
import { AdminEventFetch } from '@/fetch/admin'
import CommentFetch from '@/fetch/comment'
import { MemberCommentFetch } from '@/fetch/member'
import { modalEventId, notifyEventUpdate, showEventModal } from '@/store/event'
import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
  avatar?: string
  userId: number
}

interface EventInfoModalProps {
  isOpen: boolean
  event: any
  onClose: () => void
  userAuth: any
}

// 開催日時の文字列を生成する関数
const formatEventDateTime = (event: { start: string; end: string; allDay: boolean }) => {
  // 曜日を取得する関数
  const getDayOfWeek = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return days[date.getDay()]
  }

  // 日付に曜日を付加する関数
  const addDayOfWeek = (date: Date) => {
    const formattedDate = new Intl.DateTimeFormat('ja-JP', {
      dateStyle: 'long'
    }).format(date)
    const dayOfWeek = getDayOfWeek(date)
    return `${formattedDate}(${dayOfWeek})`
  }

  if (event.allDay) {
    const startDate = new Date(event.start)
    const adjustedEnd = new Date(event.end)
    adjustedEnd.setDate(adjustedEnd.getDate() - 1)

    const formattedStart = addDayOfWeek(startDate)
    const formattedEnd = addDayOfWeek(adjustedEnd)

    if (startDate.toDateString() === adjustedEnd.toDateString()) {
      return formattedStart
    } else {
      const startYear = startDate.getFullYear()
      const endYear = adjustedEnd.getFullYear()

      if (startYear === endYear) {
        const formattedEndDate = new Intl.DateTimeFormat('ja-JP', {
          month: 'long',
          day: 'numeric'
        }).format(adjustedEnd)
        const dayOfWeek = getDayOfWeek(adjustedEnd)
        return `${formattedStart} 〜 ${formattedEndDate}(${dayOfWeek})`
      } else {
        return `${formattedStart} 〜 ${formattedEnd}`
      }
    }
  } else {
    const startDate = new Date(event.start)
    const endDate = new Date(event.end)

    const formattedStartDate = addDayOfWeek(startDate)
    const formattedStartTime = new Intl.DateTimeFormat('ja-JP', {
      timeStyle: 'short'
    }).format(startDate)
    const formattedEndDate = addDayOfWeek(endDate)
    const formattedEndTime = new Intl.DateTimeFormat('ja-JP', {
      timeStyle: 'short'
    }).format(endDate)

    if (startDate.toDateString() === endDate.toDateString()) {
      if (formattedStartTime === formattedEndTime) {
        return `${formattedStartDate} ${formattedStartTime}`
      } else {
        return `${formattedStartDate} ${formattedStartTime}〜${formattedEndTime}`
      }
    } else {
      const startYear = startDate.getFullYear()
      const endYear = endDate.getFullYear()

      if (startYear === endYear) {
        const formattedEndDate = new Intl.DateTimeFormat('ja-JP', {
          month: 'long',
          day: 'numeric'
        }).format(endDate)
        const dayOfWeek = getDayOfWeek(endDate)
        return `${formattedStartDate} ${formattedStartTime} 〜 ${formattedEndDate}(${dayOfWeek}) ${formattedEndTime}`
      } else {
        return `${formattedStartDate} ${formattedStartTime} 〜 ${formattedEndDate} ${formattedEndTime}`
      }
    }
  }
}

// 日時をフォーマットする関数
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()

  // 日付のみの比較用に時刻をリセット
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 今日の投稿
  if (targetDate.getTime() === today.getTime()) {
    return `今日 ${new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)}`
  }

  // 昨日の投稿
  if (targetDate.getTime() === yesterday.getTime()) {
    return `昨日 ${new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)}`
  }

  // それ以外の投稿
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const EventInfoModal: React.FC<EventInfoModalProps> = ({ isOpen, event, onClose, userAuth }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const commentsEnabled = config.site.comments.enabled
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && event) {
      setSuccess('')
      setError('')
      setCompleted(false)
      fetchComments()
    }
  }, [isOpen, event])

  const fetchComments = async () => {
    try {
      let response
      if (userAuth) {
        response = await MemberCommentFetch.getComments(event.id)
      } else {
        response = await CommentFetch.getComments(event.id)
      }

      if (response.ok) {
        const data = await response.json()
        setComments(
          data.map((comment: any) => ({
            id: comment.id,
            author: comment.creator.name,
            content: comment.content,
            createdAt: comment.createdAt,
            avatar: comment.creator.avatar
              ? `${config.upload.avatar.url}/${comment.creator.avatar}`
              : undefined,
            userId: comment.creator.id
          }))
        )
      }
    } catch (err) {
      console.error('コメントの取得に失敗しました:', err)
    }
  }

  if (!isOpen || !event) return null

  const handleEditEvent = async () => {
    modalEventId.set(event.id)
    showEventModal.set(true)
    onClose()
  }

  const handleDeleteEvent = async () => {
    setSuccess('')
    setError('')

    if (confirm('このイベントを削除しますか？')) {
      try {
        const response = await AdminEventFetch.removeEvent(event.id)
        if (response.ok) {
          setSuccess('イベントを削除しました。')
          setCompleted(true)
          notifyEventUpdate()
        } else {
          const errorData = await response.json()
          setError(`削除に失敗しました: ${errorData.message}`)
        }
      } catch (error) {
        setError('通信エラーが発生しました')
      }
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await MemberCommentFetch.addComment({
        eventId: event.id,
        content: newComment
      })

      if (response.ok) {
        setNewComment('')
        setSuccess('コメントを投稿しました')
        fetchComments()
        notifyEventUpdate()
      } else {
        const data = await response.json()
        setError(data.message || 'コメントの投稿に失敗しました')
      }
    } catch (err) {
      setError('コメントの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('このコメントを削除してもよろしいですか？')) return

    try {
      const response = await MemberCommentFetch.deleteComment(commentId)
      if (response.ok) {
        setSuccess('コメントを削除しました')
        fetchComments()
        notifyEventUpdate()
      } else {
        const data = await response.json()
        setError(data.message || 'コメントの削除に失敗しました')
      }
    } catch (err) {
      setError('コメントの削除に失敗しました')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50">
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
        {/* ヘッダー - 固定 */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-white to-gray-50 px-6 pt-6">
          <div className="absolute top-6 right-6">
            <button
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

          <h2 className="mb-3 text-3xl font-bold text-gray-900">{event.title}</h2>
        </div>

        {/* コンテンツ - スクロール可能 */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-6 pt-0 pb-4">
          {success && <Alert message={success} type="success" />}
          {error && <Alert message={error} type="error" />}

          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-500">開催日時</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{formatEventDateTime(event)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* イベント内容セクション */}
          {(event.description || event.url) && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <svg
                    className="h-5 w-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-gray-900">イベント内容</h3>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                {event.description && (
                  <div className="prose prose-gray prose-p:my-2 prose-h1:text-lg prose-h2:text-lg prose-h2:mb-1 prose-h2:mt-1 prose-h3:text-base prose-li:my-0.5 prose-ul:mt-1 prose-ul:mb-2 prose-ol:mt-1 prose-ol:mb-2 max-w-none">
                    <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                      {event.description}
                    </ReactMarkdown>
                  </div>
                )}
                {event.url && (
                  <div className={event.description ? 'mt-4' : 'mt-0'}>
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg bg-gray-50 px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      詳細ページで確認する
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* コメントセクション */}
          {commentsEnabled && (userAuth || comments.length > 0) && (
            <div className="mt-10 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">コメント</h3>

              {/* コメント一覧 */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={
                          comment.avatar ||
                          `${config.upload.avatar.url}/${config.upload.avatar.default}`
                        }
                        alt={comment.author}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{comment.author}</h4>
                          <span className="text-gray-500">{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-gray-600">{comment.content}</p>
                      </div>
                      {userAuth?.id === comment.userId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* コメント入力フォーム - ログインユーザのみ表示 */}
              {userAuth && (
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="コメントを入力..."
                      className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                      rows={3}
                      disabled={isSubmitting}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        text="コメントを投稿"
                        disabled={isSubmitting || !newComment.trim()}
                      />
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 管理者用ボタン */}
          {userAuth && ['ADMIN', 'MODERATOR', 'EDITOR'].includes(userAuth.role) && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {!completed && (
                  <Button type="button" variant="info" onClick={handleEditEvent}>
                    <svg
                      aria-hidden="true"
                      className="mr-1 -ml-1 h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    編集
                  </Button>
                )}
                {completed && (
                  <Button type="button" variant="default" onClick={onClose}>
                    閉じる
                  </Button>
                )}
              </div>
              {!completed && (
                <Button type="button" variant="error" onClick={handleDeleteEvent}>
                  <svg
                    aria-hidden="true"
                    className="mr-1.5 -ml-1 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  削除
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventInfoModal
