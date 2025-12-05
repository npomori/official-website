import ImageModal from '@/components/base/ImageModal'
import ContentNotFound from '@/components/ContentNotFound'
import LocationFetch from '@/fetch/location'
import { getLocationUploadConfig } from '@/types/config'
import type { LocationData } from '@/types/location'
import React, { useEffect, useState } from 'react'

interface LocationDetailProps {
  locationId?: string | undefined
}

const LocationDetail: React.FC<LocationDetailProps> = ({ locationId }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  // 設定を取得
  const locationConfig = getLocationUploadConfig()

  // 活動地データを取得する関数（LocationFetch経由）
  const fetchLocation = async (id: string) => {
    try {
      setIsLoading(true)
      const result = await LocationFetch.getLocationById(id)

      if (result.success && result.data) {
        // APIレスポンスをLocationData形式に変換
        const apiData = result.data
        const locationData: LocationData = {
          id: apiData.id,
          name: apiData.name,
          position: apiData.position as [number, number],
          type: apiData.type,
          activities: apiData.activities || undefined,
          image: apiData.image || undefined,
          address: apiData.address || undefined,
          hasDetail: apiData.hasDetail,
          detailInfo: apiData.hasDetail
            ? {
                access: apiData.access || '',
                facilities: apiData.facilities || '',
                schedule: apiData.schedule || '',
                requirements: apiData.requirements || '',
                contact: apiData.contact || '',
                organizer: apiData.organizer || undefined,
                startedDate: apiData.startedDate || undefined,
                gallery: apiData.images || [],
                activityDetails: apiData.activityDetails || undefined,
                fieldCharacteristics: apiData.fieldCharacteristics || undefined,
                meetingPoint: apiData.meetingAddress
                  ? {
                      address: apiData.meetingAddress,
                      time: apiData.meetingTime || '',
                      mapUrl: apiData.meetingMapUrl || undefined,
                      additionalInfo: apiData.meetingAdditionalInfo || undefined
                    }
                  : undefined,
                participationFee: apiData.participationFee || undefined,
                upcomingDates: apiData.upcomingDates || undefined,
                notes: apiData.notes || undefined,
                other: apiData.other || undefined,
                attachments: apiData.attachments || undefined
              }
            : undefined
        }
        setLocation(locationData)
      } else {
        setLocation(null)
      }
    } catch (err) {
      console.error('活動地取得エラー:', err)
      setLocation(null)
    } finally {
      setIsLoading(false)
    }
  }

  // URLからIDを取得して活動地データを取得
  useEffect(() => {
    if (!locationId) {
      const pathSegments = window.location.pathname.split('/')
      const idFromUrl = pathSegments[pathSegments.length - 1]
      if (idFromUrl) {
        fetchLocation(idFromUrl)
      }
    } else {
      fetchLocation(locationId)
    }
  }, [locationId])

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
  if (!isLoading && !location) {
    return (
      <ContentNotFound
        title="活動地が見つかりません"
        className="py-20"
        secondaryHref="/"
        secondaryLabel="ホームに戻る"
        primaryHref="/locations"
        primaryLabel="活動地一覧に戻る"
        primaryEmphasis
      />
    )
  }

  // locationがnullの場合は何も表示しない（エラー状態で既に処理済み）
  if (!location) {
    return null
  }

  const detailInfo = location.detailInfo

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = '/locations')}
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
            活動地一覧に戻る
          </button>
        </div>
      </div>

      {/* タイトル */}
      <h1 className="mb-6 text-3xl font-bold">{location.name}</h1>

      {/* メイン画像 */}
      <div className="mb-8">
        <img
          src={
            location.image ||
            'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=60'
          }
          alt={location.name}
          className="h-96 w-full rounded-lg object-cover shadow-lg"
        />
      </div>

      {/* 詳細情報が存在しない場合のメッセージ */}
      {!detailInfo && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-gray-600">詳細情報は準備中です。</p>
        </div>
      )}

      {/* 活動情報 */}
      {detailInfo && (detailInfo.activityDetails || detailInfo.fieldCharacteristics) && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">活動情報</h2>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            {detailInfo.activityDetails && (
              <div className="mb-6">
                <h3 className="mb-3 text-xl font-bold">活動内容</h3>
                <p className="leading-relaxed whitespace-pre-line text-gray-700">
                  {detailInfo.activityDetails}
                </p>
              </div>
            )}
            {detailInfo.fieldCharacteristics && (
              <div>
                <h3 className="mb-3 text-xl font-bold">フィールドの特徴</h3>
                <p className="leading-relaxed whitespace-pre-line text-gray-700">
                  {detailInfo.fieldCharacteristics}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 集合場所・時間 */}
      {detailInfo && detailInfo.meetingPoint && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">集合場所・時間</h2>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 space-y-3 text-gray-700">
              <div>
                <span className="font-semibold">集合場所：</span>
                <span>{detailInfo.meetingPoint.address}</span>
              </div>
              <div>
                <span className="font-semibold">集合時間：</span>
                <span>{detailInfo.meetingPoint.time}</span>
              </div>
            </div>
            {detailInfo.meetingPoint.additionalInfo && (
              <div className="mt-3 rounded bg-blue-50 p-3">
                <p className="text-base whitespace-pre-line text-gray-700">
                  {detailInfo.meetingPoint.additionalInfo}
                </p>
              </div>
            )}
            {detailInfo.meetingPoint.mapUrl && (
              <div className="mt-4">
                <iframe
                  src={detailInfo.meetingPoint.mapUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                  title="集合場所の地図"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* 活動地情報 */}
      {detailInfo && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">活動地情報</h2>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">住所</h3>
                  <p className="text-gray-700">{location.address || '情報なし'}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">アクセス</h3>
                  <p className="text-gray-700">{detailInfo.access}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">施設</h3>
                  <p className="text-gray-700">{detailInfo.facilities}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold">活動日</h3>
                  <p className="text-gray-700">{detailInfo.schedule}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">必要な持ち物</h3>
                  <p className="text-gray-700">{detailInfo.requirements}</p>
                </div>
                {detailInfo.participationFee && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">参加費</h3>
                    <p className="text-gray-700">{detailInfo.participationFee}</p>
                  </div>
                )}
                <div>
                  <h3 className="mb-2 text-lg font-semibold">お問い合わせ</h3>
                  <p className="text-gray-700">{detailInfo.contact}</p>
                </div>
                {detailInfo.organizer && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">活動世話人</h3>
                    <p className="text-gray-700">{detailInfo.organizer}</p>
                  </div>
                )}
                {detailInfo.startedDate && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">活動開始年月</h3>
                    <p className="text-gray-700">{detailInfo.startedDate}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 添付ファイル */}
            {detailInfo.attachments && detailInfo.attachments.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-3 text-lg font-semibold">添付ファイル</h3>
                <div className="flex flex-wrap gap-2">
                  {detailInfo.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <i className="fas fa-file-alt mr-2"></i>
                      {file.name}
                      {file.size && (
                        <span className="ml-2 text-xs text-gray-500">({file.size})</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 活動予定日 */}
      {detailInfo && detailInfo.upcomingDates && detailInfo.upcomingDates.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">活動予定日</h2>
          <details className="group rounded-lg bg-white shadow-lg">
            <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-gray-700 hover:bg-gray-50">
              <span className="flex items-center">
                <svg
                  className="text-primary-600 mr-2 h-5 w-5"
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
                本年度の活動予定
              </span>
              <svg
                className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="border-t border-gray-200 px-6 pt-4 pb-6">
              <ul className="space-y-2">
                {detailInfo.upcomingDates.map((date, index) => (
                  <li
                    key={index}
                    className="flex items-center rounded-lg bg-gray-50 px-4 py-3 text-gray-700"
                  >
                    <svg
                      className="text-primary-600 mr-3 h-4 w-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                    <span>{date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </section>
      )}

      {/* 注意事項 */}
      {detailInfo && detailInfo.notes && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">注意事項</h2>
          <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-6">
            <p className="leading-relaxed whitespace-pre-line text-gray-700">{detailInfo.notes}</p>
          </div>
        </section>
      )}

      {/* その他 */}
      {detailInfo && detailInfo.other && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">その他</h2>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <p className="leading-relaxed whitespace-pre-line text-gray-700">{detailInfo.other}</p>
          </div>
        </section>
      )}

      {/* ギャラリー */}
      {detailInfo &&
        detailInfo.gallery &&
        detailInfo.gallery.length > 0 &&
        locationConfig.enabled && (
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">活動写真</h2>
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {detailInfo.gallery.map((image, index) => {
                  // 外部URLの場合はそのまま使用、ローカルファイルの場合はプレフィックスを付ける
                  const imageSrc = image.startsWith('http')
                    ? image
                    : `${locationConfig.url}/${image}`
                  return (
                    <div key={index} className="overflow-hidden rounded-lg">
                      <img
                        src={imageSrc}
                        alt={`${location.name}の活動写真 ${index + 1}`}
                        className="h-48 w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
                        onClick={() =>
                          handleImageClick(imageSrc, `${location.name}の活動写真 ${index + 1}`)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

      {/* 戻るボタン */}
      <div className="text-center">
        <a
          href="/locations"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          活動地一覧に戻る
        </a>
      </div>

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

export default LocationDetail
