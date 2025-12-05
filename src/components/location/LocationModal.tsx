import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import config from '@/config/config.json'
import locationOptions from '@/config/location.json'
import AdminLocationFetch from '@/fetch/admin/location'
import { locationCreateSchema, type LocationCreate } from '@/schemas/location'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'

interface LocationModalProps {
  locationId: string
  onClose: () => void
  onSuccess?: () => void
}

const LocationModal: React.FC<LocationModalProps> = ({ locationId, onClose, onSuccess }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedMainImage, setSelectedMainImage] = useState<File | null>(null)
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<File[]>([])
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<
    Array<{ name: string; url: string; size: string }>
  >([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const locationConfig = config.upload.location
  const fieldClass =
    'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-primary-500 focus:ring-primary-500 focus:outline-none'
  const disabledFieldClass = `${fieldClass} cursor-not-allowed bg-gray-100 text-gray-500`

  const getInitialLocationName = () => {
    const location = locationOptions.find((loc) => loc.value === locationId)
    return location?.name || ''
  }

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LocationCreate>({
    resolver: zodResolver(locationCreateSchema),
    defaultValues: {
      id: locationId,
      name: getInitialLocationName(),
      position: [0, 0],
      type: 'regular' as const,
      activities: null,
      image: null,
      address: null,
      hasDetail: false,
      activityDetails: null,
      fieldCharacteristics: null,
      access: null,
      facilities: null,
      schedule: null,
      requirements: null,
      participationFee: null,
      contact: null,
      notes: null,
      other: null,
      meetingAddress: null,
      meetingTime: null,
      meetingMapUrl: null,
      meetingAdditionalInfo: null,
      images: null,
      attachments: null,
      upcomingDates: null
    }
  })

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLoading(true)
      setSuccess('')
      setError('')
      try {
        const result = await AdminLocationFetch.getLocationById(locationId)
        if (result.success && result.data) {
          setIsEditMode(true)
          const location = result.data
          reset({
            id: location.id,
            name: location.name,
            position: location.position || [0, 0],
            type: location.type || 'regular',
            activities: location.activities || null,
            image: location.image || null,
            address: location.address || null,
            hasDetail: location.hasDetail || false,
            activityDetails: location.activityDetails || null,
            fieldCharacteristics: location.fieldCharacteristics || null,
            access: location.access || null,
            facilities: location.facilities || null,
            schedule: location.schedule || null,
            requirements: location.requirements || null,
            participationFee: location.participationFee || null,
            contact: location.contact || null,
            notes: location.notes || null,
            other: location.other || null,
            meetingAddress: location.meetingAddress || null,
            meetingTime: location.meetingTime || null,
            meetingMapUrl: location.meetingMapUrl || null,
            meetingAdditionalInfo: location.meetingAdditionalInfo || null,
            images: location.images || null,
            attachments: location.attachments || null,
            upcomingDates: location.upcomingDates || null
          })
          if (location.images && Array.isArray(location.images)) {
            setExistingGalleryImages(location.images as string[])
          }
          if (location.attachments && Array.isArray(location.attachments)) {
            setExistingAttachments(
              location.attachments as Array<{ name: string; url: string; size: string }>
            )
          }
        }
      } catch (err) {
        console.log('新規登録モーチE', err)
        setIsEditMode(false)
      } finally {
        setIsLoading(false)
      }
    }
    void fetchLocation()
  }, [locationId, reset])

  useEffect(() => {
    if ((success || error) && scrollRef.current) {
      try {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      } catch {
        scrollRef.current.scrollTop = 0
      }
    }
  }, [success, error])

  const onSubmit = async (values: LocationCreate) => {
    setSuccess('')
    setError('')

    try {
      const formData = new FormData()
      formData.append('id', values.id)
      formData.append('name', values.name)
      formData.append('position', JSON.stringify(values.position))
      formData.append('type', values.type)
      formData.append('hasDetail', String(values.hasDetail))
      formData.append('isDraft', String(watch('hasDetail') === false))

      if (values.activities) formData.append('activities', values.activities)
      if (values.address) formData.append('address', values.address)
      if (values.activityDetails) formData.append('activityDetails', values.activityDetails)
      if (values.fieldCharacteristics)
        formData.append('fieldCharacteristics', values.fieldCharacteristics)
      if (values.access) formData.append('access', values.access)
      if (values.facilities) formData.append('facilities', values.facilities)
      if (values.schedule) formData.append('schedule', values.schedule)
      if (values.requirements) formData.append('requirements', values.requirements)
      if (values.participationFee) formData.append('participationFee', values.participationFee)
      if (values.contact) formData.append('contact', values.contact)
      if (values.notes) formData.append('notes', values.notes)
      if (values.other) formData.append('other', values.other)
      if (values.meetingAddress) formData.append('meetingAddress', values.meetingAddress)
      if (values.meetingTime) formData.append('meetingTime', values.meetingTime)
      if (values.meetingMapUrl) formData.append('meetingMapUrl', values.meetingMapUrl)
      if (values.meetingAdditionalInfo)
        formData.append('meetingAdditionalInfo', values.meetingAdditionalInfo)

      const upcomingDatesText = watch('upcomingDates')
      if (upcomingDatesText && typeof upcomingDatesText === 'string') {
        formData.append('upcomingDates', upcomingDatesText)
      }

      if (selectedMainImage) {
        formData.append('image', selectedMainImage)
      }

      selectedGalleryImages.forEach((file) => {
        formData.append('gallery', file)
      })

      if (removedImages.length > 0) {
        formData.append('removedImages', JSON.stringify(removedImages))
      }

      selectedAttachments.forEach((file) => {
        formData.append('attachments', file)
      })

      let result
      if (isEditMode) {
        result = await AdminLocationFetch.updateLocationWithFiles(locationId, formData)
      } else {
        result = await AdminLocationFetch.createLocationWithFiles(formData)
      }

      if (result.success) {
        setSuccess(isEditMode ? '活動地を更新しました' : '活動地を登録しました')
        setCompleted(true)
      } else {
        setError(result.message || '活動地の保存に失敗しました')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '活動地の保存に失敗しました')
    }
  }

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    if (completed && onSuccess) {
      onSuccess()
    }
    onClose()
  }

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > locationConfig.maxFileSize) {
        const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
        setError(`画像ファイルサイズが大きすぎます (最大${maxSizeMB}MB)`)
        return
      }
      setSelectedMainImage(file)
    }
  }

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalCount =
      selectedGalleryImages.length +
      existingGalleryImages.length -
      removedImages.length +
      files.length
    if (totalCount > locationConfig.maxFiles) {
      setError(`画像数が多すぎます (最大${locationConfig.maxFiles}枚)`)
      return
    }
    for (const file of files) {
      if (file.size > locationConfig.maxFileSize) {
        const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
        setError(`画像サイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`)
        return
      }
    }
    setSelectedGalleryImages((prev) => [...prev, ...files])
  }

  const handleRemoveGalleryImage = (index: number) => {
    setSelectedGalleryImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (imageUrl: string) => {
    setRemovedImages((prev) => [...prev, imageUrl])
    setExistingGalleryImages((prev) => prev.filter((url) => url !== imageUrl))
  }

  const handleAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalCount = selectedAttachments.length + existingAttachments.length + files.length
    if (totalCount > locationConfig.maxFiles) {
      setError(`添付ファイル数が多すぎます (最大${locationConfig.maxFiles}個)`)
      return
    }
    for (const file of files) {
      if (file.size > locationConfig.maxFileSize) {
        const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
        setError(`ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`)
        return
      }
    }
    setSelectedAttachments((prev) => [...prev, ...files])
  }

  const handleRemoveAttachment = (index: number) => {
    setSelectedAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
        {/* ヘッダー - 固定 */}
        <div className="relative flex-shrink-0 px-6 pt-6 pb-4">
          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={handleCancel}
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
          <h2 className="mb-3 text-3xl font-bold text-gray-900">
            {isEditMode ? '活動地を編集' : '活動地を登録'}
          </h2>
          <p className="text-gray-600">{getInitialLocationName()}</p>
        </div>

        {/* コンテンツ - スクロール可能 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {success && <Alert message={success} type="success" />}
              {error && <Alert message={error} type="error" />}
              <fieldset disabled={completed}>
                {/* 基本惁E�� */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">基本惁E��</h3>

                  <div className="mb-4">
                    <label htmlFor="id" className="mb-1 block text-sm font-medium text-gray-700">
                      ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="id"
                      type="text"
                      disabled
                      {...register('id')}
                      className={disabledFieldClass}
                    />
                    {errors.id && <p className="mt-1 text-xs text-red-600">{errors.id.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input id="name" type="text" {...register('name')} className={fieldClass} />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="position-lat"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        緯度 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="position-lat"
                        type="text"
                        value={watch('position')?.[0] ?? 0}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value) || 0
                          const lng = watch('position')?.[1] ?? 0
                          setValue('position', [lat, lng])
                        }}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="position-lng"
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        経度 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="position-lng"
                        type="text"
                        value={watch('position')?.[1] ?? 0}
                        onChange={(e) => {
                          const lat = watch('position')?.[0] ?? 0
                          const lng = parseFloat(e.target.value) || 0
                          setValue('position', [lat, lng])
                        }}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                  {errors.position && (
                    <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>
                  )}

                  <div className="mb-4">
                    <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
                      タイチE<span className="text-red-500">*</span>
                    </label>
                    <select id="type" {...register('type')} className={fieldClass}>
                      <option value="regular">定期活動地</option>
                      <option value="event">イベント開催地</option>
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="address"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      住所
                    </label>
                    <input
                      id="address"
                      type="text"
                      {...register('address')}
                      className={fieldClass}
                    />
                    {errors.address && (
                      <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="activities"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      活動�E容
                    </label>
                    <textarea
                      id="activities"
                      rows={3}
                      {...register('activities')}
                      className={fieldClass}
                    />
                    {errors.activities && (
                      <p className="mt-1 text-xs text-red-600">{errors.activities.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="mb-1 flex items-center text-sm font-medium text-gray-900">
                      <input
                        type="checkbox"
                        {...register('hasDetail')}
                        className="text-primary-600 focus:ring-primary-500 mr-2 h-4 w-4 rounded border-gray-300"
                      />
                      詳細惁E��を�E閁E{' '}
                    </label>
                    {errors.hasDetail && (
                      <p className="mt-1 text-xs text-red-600">{errors.hasDetail.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="image" className="mb-1 block text-sm font-medium text-gray-700">
                      メイン画像
                    </label>
                    {watch('image') && !selectedMainImage && (
                      <div className="mb-2">
                        <img
                          src={watch('image') || ''}
                          alt="現在のメイン画像"
                          className="h-32 w-auto rounded border border-gray-300 object-cover"
                        />
                      </div>
                    )}
                    {selectedMainImage && (
                      <div className="mb-2">
                        <img
                          src={URL.createObjectURL(selectedMainImage)}
                          alt="新しいメイン画像"
                          className="h-32 w-auto rounded border border-gray-300 object-cover"
                        />
                      </div>
                    )}
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageChange}
                      className="w-full text-sm text-gray-700"
                    />
                    {errors.image && (
                      <p className="mt-1 text-xs text-red-600">{errors.image.message}</p>
                    )}
                  </div>
                </div>

                {/* 活動情報 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">活動情報</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="activityDetails"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      活動�E詳細
                    </label>
                    <textarea
                      id="activityDetails"
                      rows={4}
                      {...register('activityDetails')}
                      className={fieldClass}
                    />
                    {errors.activityDetails && (
                      <p className="mt-1 text-xs text-red-600">{errors.activityDetails.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="fieldCharacteristics"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      フィールド�E特徴
                    </label>
                    <textarea
                      id="fieldCharacteristics"
                      rows={3}
                      {...register('fieldCharacteristics')}
                      className={fieldClass}
                    />
                    {errors.fieldCharacteristics && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.fieldCharacteristics.message}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="schedule"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      スケジュール
                    </label>
                    <input
                      id="schedule"
                      type="text"
                      {...register('schedule')}
                      placeholder="例: 毎週日曜日 9:00-12:00"
                      className={fieldClass}
                    />
                    {errors.schedule && (
                      <p className="mt-1 text-xs text-red-600">{errors.schedule.message}</p>
                    )}
                  </div>
                </div>

                {/* 雁E��場所 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">雁E��場所</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingAddress"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      雁E��場所の住所
                    </label>
                    <input
                      id="meetingAddress"
                      type="text"
                      {...register('meetingAddress')}
                      className={fieldClass}
                    />
                    {errors.meetingAddress && (
                      <p className="mt-1 text-xs text-red-600">{errors.meetingAddress.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingTime"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      雁E��時刻
                    </label>
                    <input
                      id="meetingTime"
                      type="text"
                      {...register('meetingTime')}
                      placeholder="侁E 9:00"
                      className={fieldClass}
                    />
                    {errors.meetingTime && (
                      <p className="mt-1 text-xs text-red-600">{errors.meetingTime.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingMapUrl"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      地図URL
                    </label>
                    <input
                      id="meetingMapUrl"
                      type="text"
                      {...register('meetingMapUrl')}
                      placeholder="Google Maps等�EURL"
                      className={fieldClass}
                    />
                    {errors.meetingMapUrl && (
                      <p className="mt-1 text-xs text-red-600">{errors.meetingMapUrl.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingAdditionalInfo"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      補足惁E��
                    </label>
                    <textarea
                      id="meetingAdditionalInfo"
                      rows={3}
                      {...register('meetingAdditionalInfo')}
                      className={fieldClass}
                    />
                    {errors.meetingAdditionalInfo && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.meetingAdditionalInfo.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* アクセス・施設 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">アクセス・施設</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="access"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      アクセス方法
                    </label>
                    <textarea id="access" rows={3} {...register('access')} className={fieldClass} />
                    {errors.access && (
                      <p className="mt-1 text-xs text-red-600">{errors.access.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="facilities"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      施設惁E��
                    </label>
                    <textarea
                      id="facilities"
                      rows={3}
                      {...register('facilities')}
                      placeholder="侁E トイレ有、E��車場10台"
                      className={fieldClass}
                    />
                    {errors.facilities && (
                      <p className="mt-1 text-xs text-red-600">{errors.facilities.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="requirements"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      参加条件
                    </label>
                    <textarea
                      id="requirements"
                      rows={2}
                      {...register('requirements')}
                      className={fieldClass}
                    />
                    {errors.requirements && (
                      <p className="mt-1 text-xs text-red-600">{errors.requirements.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="participationFee"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      参加費
                    </label>
                    <input
                      id="participationFee"
                      type="text"
                      {...register('participationFee')}
                      placeholder="例: 無料 / 500円"
                      className={fieldClass}
                    />
                    {errors.participationFee && (
                      <p className="mt-1 text-xs text-red-600">{errors.participationFee.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="contact"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      連絡先
                    </label>
                    <textarea
                      id="contact"
                      rows={2}
                      {...register('contact')}
                      className={fieldClass}
                    />
                    {errors.contact && (
                      <p className="mt-1 text-xs text-red-600">{errors.contact.message}</p>
                    )}
                  </div>
                </div>

                {/* ギャラリー・添仁E*/}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    ギャラリー・添付ファイル
                  </h3>

                  <div className="mb-4">
                    <label
                      htmlFor="gallery"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      ギャラリー画僁E{' '}
                    </label>

                    {existingGalleryImages.length > 0 && (
                      <div className="mb-2 grid grid-cols-3 gap-2">
                        {existingGalleryImages.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`既存画僁E${index + 1}`}
                              className="h-24 w-full rounded border border-gray-300 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(imageUrl)}
                              className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedGalleryImages.length > 0 && (
                      <div className="mb-2 grid grid-cols-3 gap-2">
                        {selectedGalleryImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`新規画僁E${index + 1}`}
                              className="h-24 w-full rounded border border-gray-300 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      id="gallery"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesChange}
                      className="w-full text-sm text-gray-700"
                    />
                    {errors.images && (
                      <p className="mt-1 text-xs text-red-600">{errors.images.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="attachments"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      添付ファイル
                    </label>

                    {existingAttachments.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {existingAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded border border-gray-300 p-2 text-sm"
                          >
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {attachment.name} ({attachment.size})
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedAttachments.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {selectedAttachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded border border-gray-300 p-2 text-sm"
                          >
                            <span className="text-gray-700">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              削除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      id="attachments"
                      type="file"
                      multiple
                      onChange={handleAttachmentsChange}
                      className="w-full text-sm text-gray-700"
                    />
                    {errors.attachments && (
                      <p className="mt-1 text-xs text-red-600">{errors.attachments.message}</p>
                    )}
                  </div>
                </div>

                {/* その他 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">その他</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="upcomingDates"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      今後の活動予定日
                    </label>
                    <textarea
                      id="upcomingDates"
                      rows={4}
                      {...register('upcomingDates')}
                      placeholder="1行に1つの日付を入力してください&#10;例&#10;2025-12-10&#10;2025-12-17&#10;2025-12-24"
                      className={fieldClass}
                    />
                    {errors.upcomingDates && (
                      <p className="mt-1 text-xs text-red-600">{errors.upcomingDates.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
                      備考
                    </label>
                    <textarea id="notes" rows={3} {...register('notes')} className={fieldClass} />
                    {errors.notes && (
                      <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="other" className="mb-1 block text-sm font-medium text-gray-700">
                      その他情報
                    </label>
                    <textarea id="other" rows={3} {...register('other')} className={fieldClass} />
                    {errors.other && (
                      <p className="mt-1 text-xs text-red-600">{errors.other.message}</p>
                    )}
                  </div>
                </div>
              </fieldset>
            </form>
          )}
        </div>

        {/* フッター - 固定 */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 pt-4 pb-6">
          <div className="flex justify-end space-x-3">
            {!completed && (
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit)}
              >
                {isEditMode ? '更新する' : '登録する'}
              </Button>
            )}
            {completed && (
              <Button type="button" variant="default" onClick={handleCancel}>
                閉じる
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default LocationModal
