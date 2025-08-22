import Button from '@/components/base/Button'
import ImageModal from '@/components/base/ImageModal'
import recordCategories from '@/config/record-category.json'
import adminRecordFetch from '@/fetch/admin/record'
import recordFetch from '@/fetch/record'
import { userStore } from '@/store/user'
import { getConfig, getRecordUploadConfig } from '@/types/config'
import type { Record } from '@/types/record'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useEffect, useState } from 'react'

interface RecordDetailProps {
  recordId?: string | undefined
}

const RecordDetail: React.FC<RecordDetailProps> = ({ recordId }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [record, setRecord] = useState<Record | null>(null)
  const [id, setId] = useState<string | undefined>(recordId)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const recordConfig = getRecordUploadConfig()

  // 管理権限をチェック
  const hasAdminRole =
    user?.role === 'ADMIN' || user?.role === 'MODERATOR' || user?.role === 'EDITOR'

  // 記録データを取得する関数
  const fetchRecord = async (recordId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = hasAdminRole
        ? await adminRecordFetch.getRecordById(parseInt(recordId))
        : await recordFetch.getRecordById(parseInt(recordId))

      if (response.success && response.data) {
        setRecord(response.data)
      } else {
        setError(response.message || '活動記録の取得に失敗しました')
      }
    } catch (err) {
      console.error('記録取得エラー:', err)
      setError('活動記録の取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // URLからIDを取得して記録データを取得
  useEffect(() => {
    if (!recordId) {
      const pathSegments = window.location.pathname.split('/')
      const recordIdFromUrl = pathSegments[pathSegments.length - 1]
      setId(recordIdFromUrl)
      if (recordIdFromUrl) {
        void fetchRecord(recordIdFromUrl)
      }
    } else {
      setId(recordId)
      void fetchRecord(recordId)
    }
  }, [recordId, hasAdminRole])

  // カテゴリーIDから日本語名に変換する関数
  const getCategoryName = (categoryId: string): string => {
    const category = recordCategories.find((cat) => cat.value === categoryId)
    return category ? category.name : categoryId
  }

  // カテゴリーIDからカラーを取得する関数
  const getCategoryColor = (categoryId: string): string => {
    const category = recordCategories.find((cat) => cat.value === categoryId)
    return category ? category.color : '#6B7280'
  }

  // 日付をフォーマットする関数
  const formatDate = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

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

  // 画像クリック処理
  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt })
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage(null)
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
  if (error || (!isLoading && !record)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-800">活動記録が見つかりません</h2>
          <p className="mb-4 text-red-600">
            {error || '指定された活動記録は存在しないか、削除された可能性があります。'}
          </p>
          <Button variant="primary" onClick={() => (window.location.href = '/record')}>
            活動記録一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  // recordがnullの場合は何も表示しない（エラー状態で既に処理済み）
  if (!record) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <Button
            onClick={() => (window.location.href = '/record')}
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
            活動記録一覧に戻る
          </Button>
        </div>
      </div>

      {/* 活動記録記事 */}
      <article className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              {/* 活動日 */}
              <div className="flex items-center text-base text-gray-500">
                <i className="fas fa-calendar mr-1"></i>
                {record.datetime}
              </div>

              {/* カテゴリー */}
              <div className="flex items-center space-x-2">
                {record.categories && record.categories.length > 0 ? (
                  record.categories.map((category, index) => (
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
          </div>

          <div className="space-y-3">
            {/* タイトル（場所） */}
            <h1 className="text-2xl font-bold text-gray-800">{record.location}</h1>

            {/* 活動内容 */}
            <div className="space-y-4">
              <div className="flex items-start">
                <div>
                  <span className="text-base font-bold text-gray-700">活動日：</span>
                  <span className="text-base text-gray-600">{record.datetime}</span>
                </div>
              </div>

              <div className="flex items-start">
                <div>
                  <span className="text-base font-bold text-gray-700">天候：</span>
                  <span className="text-base text-gray-600">{record.weather}</span>
                </div>
              </div>

              <div className="flex items-start">
                <div>
                  <span className="text-base font-bold text-gray-700">参加者：</span>
                  <span className="text-base text-gray-600">{record.participants}</span>
                </div>
              </div>

              <div className="flex items-start">
                <div>
                  <span className="text-base font-bold text-gray-700">報告者：</span>
                  <span className="text-base text-gray-600">{record.reporter}</span>
                </div>
              </div>

              <div className="flex items-start">
                <div>
                  <span className="text-base font-bold text-gray-700">活動内容：</span>
                  <div className="mt-1 text-base whitespace-pre-wrap text-gray-600">
                    {record.content}
                  </div>
                </div>
              </div>

              {record.nearMiss && (
                <div className="flex items-start">
                  <div>
                    <span className="text-base font-bold text-gray-700">ヒヤリハット：</span>
                    <div className="mt-1 text-base whitespace-pre-wrap text-gray-600">
                      {record.nearMiss}
                    </div>
                  </div>
                </div>
              )}

              {record.equipment && (
                <div className="flex items-start">
                  <div>
                    <span className="text-base font-bold text-gray-700">動力使用：</span>
                    <div className="mt-1 text-base whitespace-pre-wrap text-gray-600">
                      {record.equipment}
                    </div>
                  </div>
                </div>
              )}

              {record.remarks && (
                <div className="flex items-start">
                  <div>
                    <span className="text-base font-bold text-gray-700">備考：</span>
                    <div className="mt-1 text-base whitespace-pre-wrap text-gray-600">
                      {record.remarks}
                    </div>
                  </div>
                </div>
              )}

              {/* 画像セクション */}
              {record.images && record.images.length > 0 && recordConfig.enabled && (
                <div className="flex items-start">
                  <div>
                    <span className="text-base font-bold text-gray-700">活動写真：</span>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {record.images.map((image, index) => (
                        <div key={index} className="group relative">
                          <img
                            src={`${recordConfig.url}/${image}`}
                            alt={`${record.location} - 写真${index + 1}`}
                            className="h-24 w-24 cursor-pointer rounded-lg object-cover shadow-md transition-shadow duration-200 hover:shadow-lg"
                            onClick={() =>
                              handleImageClick(
                                `${recordConfig.url}/${image}`,
                                `${record.location} - 写真${index + 1}`
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* 管理情報（管理者のみ表示） */}
      {hasAdminRole && (
        <div className="mt-8 rounded-lg bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-700">管理情報</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>作成者: {record.creator?.name || '不明'}</div>
            <div>作成日: {formatDateTime(record.createdAt)}</div>
            <div>更新日: {formatDateTime(record.updatedAt)}</div>
          </div>
        </div>
      )}

      {/* 画像モーダル */}
      <ImageModal
        isOpen={isImageModalOpen}
        imageSrc={selectedImage?.src || ''}
        imageAlt={selectedImage?.alt || ''}
        onClose={closeImageModal}
      />
    </div>
  )
}

export default RecordDetail
