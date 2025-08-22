import Button from '@/components/base/Button'
import ImageModal from '@/components/base/ImageModal'
import Pagination from '@/components/base/Pagination'
import recordCategories from '@/config/record-category.json'
import adminRecordFetch from '@/fetch/admin/record'
import recordFetch from '@/fetch/record'
import useSWR from '@/hooks/swr'
import { userStore } from '@/store/user'
import { getConfig, getRecordUploadConfig } from '@/types/config'
import type { Record } from '@/types/record'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import React, { useState } from 'react'
import RecordModal from './RecordModal'

const RecordList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Record | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isFilterLoading, setIsFilterLoading] = useState(false) // フィルタ専用のローディング状態

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 設定を取得
  const config = getConfig()
  const recordConfig = getRecordUploadConfig()
  const itemsPerPage = config.pagination.recordList.itemsPerPage

  // SWRでデータを取得（カテゴリーフィルター対応）
  const { data, error, isLoading, mutate } = useSWR(
    `records-${currentPage}-${itemsPerPage}-${selectedCategory || 'all'}`,
    () => recordFetch.getRecords(currentPage, itemsPerPage, selectedCategory || undefined),
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
    const category = recordCategories.find((cat) => cat.value === categoryId)
    return category ? category.name : categoryId
  }

  // カテゴリーIDからカラーを取得する関数
  const getCategoryColor = (categoryId: string): string => {
    const category = recordCategories.find((cat) => cat.value === categoryId)
    return category ? category.color : '#6B7280' // デフォルトカラー
  }

  // カテゴリーをクリックした時の処理
  const handleCategoryClick = async (categoryId: string) => {
    const newCategory = selectedCategory === categoryId ? null : categoryId
    setSelectedCategory(newCategory)
    setCurrentPage(1) // フィルタ変更時は最初のページに戻る

    // フィルタ専用のローディング状態を設定
    setIsFilterLoading(true)

    // ページの上部にスクロール（確実に実行されるように遅延）
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)

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
    setCurrentPage(1)

    // フィルタ専用のローディング状態を設定
    setIsFilterLoading(true)

    // ページの上部にスクロール（確実に実行されるように遅延）
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)

    // データを再取得
    try {
      await mutate()
    } finally {
      setIsFilterLoading(false)
    }
  }

  // 編集・削除ボタンの表示条件をチェック
  const canEditRecord = (record: Record): boolean => {
    if (!user) return false

    // ADMIN、MODERATORは常に編集可能
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      return true
    }

    // EDITORは自分の記録のみ編集可能（n日間制限付き）
    if (user.role === 'EDITOR') {
      if (record.creator.id !== user.id) {
        return false
      }

      // 記録作成日からn日間経過しているかチェック
      const recordDate = new Date(record.createdAt)
      const currentDate = new Date()
      const editDays = config.content?.record?.editDays || 7

      const diffTime = currentDate.getTime() - recordDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays <= editDays
    }

    return false
  }

  // 削除処理
  const handleDelete = async (recordId: number) => {
    if (!confirm('この活動記録を削除しますか？この操作は取り消せません。')) {
      return
    }

    setIsDeleting(recordId)

    try {
      await adminRecordFetch.deleteRecord(recordId)
      // データを再取得
      await mutate()
    } catch (error) {
      console.error('Record deletion error:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeleting(null)
    }
  }

  // 編集処理
  const handleEdit = (record: Record) => {
    setEditingRecord(record)
    setIsEditModalOpen(true)
  }

  // 編集モーダルを閉じる
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingRecord(null)
  }

  // 編集成功時の処理
  const handleEditSuccess = async () => {
    await mutate() // データを再取得
    handleCloseEditModal()
  }

  // データとページネーション情報を取得
  const records = data?.data?.records || []
  const pagination = data?.data?.pagination
  const totalPages = pagination?.totalPages || 1

  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt })
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImage(null)
  }

  // ESCキーでモーダルを閉じる処理はImageModalコンポーネント内で処理

  // ローディング中（初回読み込み時のみ）
  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">活動記録</h1>
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold">活動記録</h1>
        <div className="py-12 text-center">
          <p className="text-lg text-red-500">データの取得に失敗しました</p>
          <button
            onClick={() => mutate()}
            className="bg-primary-600 hover:bg-primary-700 mt-4 rounded px-4 py-2 text-white"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">活動記録</h1>

      {/* カテゴリーフィルター */}
      <div className="mb-6">
        {/* フィルタローディングインジケーター */}
        {isFilterLoading && (
          <div className="mb-4 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="border-t-primary-600 h-4 w-4 animate-spin rounded-full border-2 border-gray-300"></div>
              <span>フィルタ適用中...</span>
            </div>
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <span className="font-medium text-gray-700">カテゴリーで絞り込み：</span>
          {selectedCategory && (
            <button
              onClick={handleResetFilter}
              disabled={isFilterLoading}
              className="text-primary-600 hover:text-primary-800 underline disabled:opacity-50"
            >
              フィルタをリセット
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {recordCategories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryClick(category.value)}
              disabled={isFilterLoading}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
                selectedCategory === category.value ? 'text-white' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor:
                  selectedCategory === category.value ? category.color : `${category.color}20`,
                color: selectedCategory === category.value ? '#ffffff' : category.color,
                border: `1px solid ${category.color}`
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* フィルタ結果の表示 */}
      {selectedCategory && (
        <div className="bg-primary-50 mb-4 rounded-lg p-3">
          <p className="text-primary-800">
            <span className="font-medium">{getCategoryName(selectedCategory)}</span> で絞り込み中
            <span className="text-primary-600 ml-2">({pagination?.totalCount || 0}件)</span>
          </p>
        </div>
      )}

      {records.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">
            {selectedCategory
              ? `${getCategoryName(selectedCategory)}の活動記録がありません`
              : 'まだ活動記録がありません'}
          </p>
        </div>
      ) : (
        <section className="mb-12">
          <div className="space-y-8">
            {records.map((record: Record) => (
              <article key={record.id} className="overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{record.location}</h2>
                    <div className="flex items-center gap-2">
                      {record.categories && record.categories.length > 0 ? (
                        record.categories.map((category, index) => (
                          <button
                            key={index}
                            onClick={() => handleCategoryClick(category)}
                            disabled={isFilterLoading}
                            className="cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors hover:opacity-80 disabled:opacity-50"
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

                      {/* 編集・削除ボタン */}
                      {canEditRecord(record) && (
                        <div className="ml-4 flex gap-2">
                          <Button
                            variant="info"
                            size="md"
                            onClick={() => handleEdit(record)}
                            icon="mdi:pencil"
                            text="編集"
                            title="編集"
                          />
                          <Button
                            variant="error"
                            size="md"
                            onClick={() => handleDelete(record.id)}
                            disabled={isDeleting === record.id}
                            icon={isDeleting === record.id ? 'mdi:loading' : 'mdi:delete'}
                            text="削除"
                            title="削除"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
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
                        <div className="mt-1 text-base text-gray-600">{record.content}</div>
                      </div>
                    </div>

                    {record.nearMiss && (
                      <div className="flex items-start">
                        <div>
                          <span className="text-base font-bold text-gray-700">ヒヤリハット：</span>
                          <div className="mt-1 text-base text-gray-600">{record.nearMiss}</div>
                        </div>
                      </div>
                    )}

                    {record.equipment && (
                      <div className="flex items-start">
                        <div>
                          <span className="text-base font-bold text-gray-700">動力使用：</span>
                          <div className="mt-1 text-base text-gray-600">{record.equipment}</div>
                        </div>
                      </div>
                    )}

                    {record.remarks && (
                      <div className="flex items-start">
                        <div>
                          <span className="text-base font-bold text-gray-700">備考：</span>
                          <div className="mt-1 text-base text-gray-600">{record.remarks}</div>
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
            maxVisiblePages={7}
            showPageInfo={true}
          />
        </div>
      )}

      {/* 画像モーダル */}
      <ImageModal
        isOpen={isImageModalOpen}
        imageSrc={selectedImage?.src || ''}
        imageAlt={selectedImage?.alt || ''}
        onClose={closeImageModal}
      />

      {/* 編集モーダル */}
      {isEditModalOpen && editingRecord && (
        <RecordModal
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
          record={editingRecord}
          isEditMode={true}
          recordId={editingRecord.id}
        />
      )}
    </div>
  )
}

export default RecordList
