import Button from '@/components/base/Button'
import LocationSelectModal from '@/components/location/LocationSelectModal'
import { userStore } from '@/store/user'
import type { UserAuth } from '@/types/user'
import { useStore } from '@nanostores/react'
import { useState } from 'react'

const LocationModalLink: React.FC = () => {
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  // ユーザー情報を取得
  const user = useStore(userStore) as UserAuth | null

  // 編集権限をチェック
  const canEdit =
    user && (user.role === 'ADMIN' || user.role === 'MODERATOR' || user.role === 'EDITOR')

  if (!canEdit) {
    return null
  }

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId)
    // TODO: LocationModal を開く処理を実装
    console.log('Selected location:', locationId)
    alert(`活動地編集機能は準備中です。選択されたID: ${locationId}`)
  }

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setShowSelectModal(true)}
        icon="mdi:pencil"
        text="活動地を編集"
      />

      <LocationSelectModal
        isOpen={showSelectModal}
        onClose={() => setShowSelectModal(false)}
        onSelect={handleSelectLocation}
      />

      {/* TODO: LocationModal コンポーネントを追加 */}
    </>
  )
}

export default LocationModalLink
