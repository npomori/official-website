import locationConfig from '@/config/location.json'
import LocationFetch from '@/fetch/location'
import type { LocationData } from '@/types/location'
import React, { useEffect, useState } from 'react'

// KinkiMapを動的インポート（クライアントサイドのみ）
const KinkiMap = React.lazy(() => import('@/components/KinkiMap'))

// location.jsonの並び順に従ってソートする関数
const sortLocationsByConfig = (locations: LocationData[]): LocationData[] => {
  const orderMap = new Map(locationConfig.map((item, index) => [item.value, index]))
  return locations.sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? 999
    const orderB = orderMap.get(b.id) ?? 999
    return orderA - orderB
  })
}

const LocationList: React.FC = () => {
  const [regularLocations, setRegularLocations] = useState<LocationData[]>([])
  const [otherLocations, setOtherLocations] = useState<LocationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const fetchLocations = async () => {
      try {
        setIsLoading(true)

        // 定例活動地を取得
        const regularResult = await LocationFetch.getLocations({ type: 'regular' })
        if (regularResult.success && regularResult.data?.locations) {
          setRegularLocations(sortLocationsByConfig(regularResult.data.locations))
        }

        // 他団体との共同活動地を取得
        const otherResult = await LocationFetch.getLocations({ type: 'collaboration' })
        if (otherResult.success && otherResult.data?.locations) {
          setOtherLocations(sortLocationsByConfig(otherResult.data.locations))
        }
      } catch (error) {
        console.error('活動地データの取得に失敗しました:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [])

  // 地図で特定の場所にフォーカスする関数
  const focusOnMap = (locationName: string) => {
    // 地図セクションにスクロール
    const mapSection = document.querySelector('.map-section')
    if (mapSection) {
      const offset = 150
      const elementPosition = mapSection.getBoundingClientRect().top + window.pageYOffset - offset

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }

    // 少し遅延を入れてからイベントを発火
    setTimeout(() => {
      const event = new CustomEvent('focusLocation', {
        detail: { location: locationName }
      })
      window.dispatchEvent(event)
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-3xl font-bold">活動地紹介</h1>

      {/* 活動に参加するには */}
      <section className="bg-primary-50 mb-12 rounded-lg p-8">
        <h2 className="mb-4 text-2xl font-bold">活動に参加するには</h2>
        <p className="mb-6 text-gray-700">
          私たちの活動に興味のある方は、ぜひご参加ください。
          経験や知識は問いません。私たちと一緒に、自然を守る活動を始めましょう。
        </p>
        <div className="flex space-x-4">
          <a
            href="/join"
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-6 py-3 text-white transition-colors"
          >
            入会案内へ
          </a>
          <a
            href="/schedule"
            className="border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg border bg-white px-6 py-3 transition-colors"
          >
            活動予定を確認
          </a>
        </div>
      </section>

      <div className="border-primary-200 bg-primary-50 mb-6 rounded-lg border p-6">
        <h2 className="mb-2 text-lg font-bold text-gray-800">活動地の種類</h2>
        <p className="text-gray-700">
          当協会の活動地には、定例活動地と他団体との共同活動地があります。
        </p>
      </div>

      {/* 活動地マップ */}
      <section className="map-section mb-12">
        {isMounted && (
          <React.Suspense
            fallback={
              <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <KinkiMap locations={regularLocations} />
          </React.Suspense>
        )}
      </section>

      {/* 定例活動地 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">定例活動地</h2>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          {regularLocations.length === 0 ? (
            <p className="text-center text-gray-500">定例活動地はまだありません。</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {regularLocations.map((location) => (
                <div key={location.id}>
                  <img
                    src={
                      location.image ||
                      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60'
                    }
                    alt={location.name}
                    className="mb-4 h-48 w-full rounded-lg object-cover"
                  />
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xl font-bold">{location.name}</h3>
                    <button
                      onClick={() => focusOnMap(location.name)}
                      className="text-primary-600 hover:text-primary-700 cursor-pointer drop-shadow-sm transition-all duration-200 hover:scale-110"
                      title="地図で見る"
                    >
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  {location.activities && (
                    <p className="mb-4 text-gray-700">{location.activities}</p>
                  )}
                  {location.hasDetail && (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={`/locations/${location.id}`}
                        className="text-primary-600 hover:text-primary-800 inline-flex items-center text-base font-semibold"
                        title={`${location.name}の詳細ページへ`}
                      >
                        {location.name}の詳細
                        <i className="fas fa-arrow-right ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 他団体との共同活動地 */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">他団体との共同活動地</h2>
        <div className="rounded-lg bg-white p-6 shadow-lg">
          {otherLocations.length === 0 ? (
            <p className="text-center text-gray-500">他団体との共同活動地はまだありません。</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherLocations.map((location) => (
                <div key={location.id}>
                  <img
                    src={
                      location.image ||
                      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=60'
                    }
                    alt={location.name}
                    className="mb-4 h-48 w-full rounded-lg object-cover"
                  />
                  <h3 className="mb-3 text-xl font-bold">{location.name}</h3>
                  {location.activities && (
                    <p className="mb-4 text-gray-700">{location.activities}</p>
                  )}
                  {location.hasDetail && (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={`/locations/${location.id}`}
                        className="text-primary-600 hover:text-primary-800 inline-flex items-center text-base font-semibold"
                        title={`${location.name}の詳細ページへ`}
                      >
                        {location.name}の詳細
                        <i className="fas fa-arrow-right ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default LocationList
