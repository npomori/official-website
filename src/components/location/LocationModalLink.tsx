import Button from '@/components/base/Button'
import LocationModal from '@/components/location/LocationModal'
import LocationSelectModal from '@/components/location/LocationSelectModal'
import { useState } from 'react'

const LocationModalLink: React.FC = () => {
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId)
    setShowSelectModal(false)
    setShowLocationModal(true)
  }

  const handleCloseLocationModal = () => {
    setShowLocationModal(false)
    setSelectedLocationId(null)
  }

  const handleSuccess = () => {
    setShowLocationModal(false)
    setSelectedLocationId(null)
    window.location.reload()
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

      {showLocationModal && selectedLocationId && (
        <LocationModal
          locationId={selectedLocationId}
          onClose={handleCloseLocationModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

export default LocationModalLink
