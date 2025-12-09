import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LocationData } from '../data/locations'

// Leafletのデフォルトアイコンの問題を修正
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// 地図の表示位置を制御するコンポーネント
interface MapControllerProps {
  targetLocation?: string
  locations: LocationData[]
}

const MapController: React.FC<MapControllerProps> = ({ targetLocation, locations }) => {
  const map = useMap()

  useEffect(() => {
    if (targetLocation) {
      console.log('MapController: Focusing on location:', targetLocation)
      const location = locations.find((loc) => loc.name === targetLocation)
      if (location) {
        console.log('MapController: Found location data:', location)
        map.setView(location.position, 14, {
          animate: true,
          duration: 1
        })
      } else {
        console.log('MapController: Location not found:', targetLocation)
      }
    }
  }, [targetLocation, map, locations])

  return null
}

interface KinkiMapProps {
  locations: LocationData[]
}

const KinkiMap: React.FC<KinkiMapProps> = ({ locations }) => {
  const [targetLocation, setTargetLocation] = useState<string | undefined>()
  const [isReady, setIsReady] = useState(false)

  // コンポーネントの初期化完了を通知
  useEffect(() => {
    // 少し遅延を入れてコンポーネントの初期化を確実にする
    const timer = setTimeout(() => {
      setIsReady(true)

      // 初期化完了後にイベントリスナーを設定
      const handleFocusLocation = (event: CustomEvent) => {
        console.log('KinkiMap received focusLocation event:', event.detail)
        setTargetLocation(event.detail.location)
      }

      window.addEventListener('focusLocation', handleFocusLocation as EventListener)

      // クリーンアップ関数を返す
      return () => {
        window.removeEventListener('focusLocation', handleFocusLocation as EventListener)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // すべての活動地の境界を計算
  const allActivityBounds = L.latLngBounds(locations.map((l) => l.position))

  // 定例活動地のみ表示するためマーカー色は固定（緑色）
  const getMarkerColor = () => {
    return '#16a34a' // 緑色（定例活動地）
  }

  return (
    <div className="relative z-0 w-full">
      {/* ヘッダー部分 */}
      <div className="bg-primary-600 p-2 text-white shadow-lg">
        <div className="text-center">
          <h1 className="text-xl font-bold">活動地マップ</h1>
        </div>
      </div>

      {/* 地図部分 */}
      <div className="relative h-[500px] w-full" style={{ zIndex: 0 }}>
        <MapContainer
          bounds={allActivityBounds}
          boundsOptions={{ padding: [50, 50] }}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <MapController targetLocation={targetLocation} locations={locations} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {locations.map((location, index) => (
            <Marker key={index} position={location.position}>
              <Tooltip
                permanent
                direction="right"
                offset={[-3, 0]}
                opacity={0.9}
                className="map-label"
              >
                {location.name}
              </Tooltip>
              <Popup>
                <div className="p-2">
                  <h3 className="mb-2 text-lg font-bold text-gray-800">{location.name}</h3>
                  {location.activities && (
                    <p className="text-sm text-gray-600">{location.activities}</p>
                  )}
                  {location.address && (
                    <p className="mt-1 text-xs text-gray-500">{location.address}</p>
                  )}
                  <span className="bg-primary-100 text-primary-800 mt-2 inline-block rounded px-2 py-1 text-xs">
                    定例活動地
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default KinkiMap
