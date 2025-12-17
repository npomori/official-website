import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import config from '@/config/config.json'
import locationTypes from '@/config/location-type.json'
import locationOptions from '@/config/location.json'
import AdminLocationFetch from '@/fetch/admin/location'
import { formatFileSize } from '@/helpers/file'
import { locationCreateSchema, type LocationCreate } from '@/schemas/location'
import type { ImageAttachment } from '@/types/attachment'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Controller, useForm } from 'react-hook-form'
import { NumericFormat } from 'react-number-format'

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
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<
    Array<{ file: File; caption: string }>
  >([])
  const [existingGalleryImages, setExistingGalleryImages] = useState<ImageAttachment[]>([])
  const [removedImages, setRemovedImages] = useState<string[]>([])
  const [selectedAttachments, setSelectedAttachments] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<
    Array<{ name: string; filename: string; size: number }>
  >([])
  const [removedAttachments, setRemovedAttachments] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const locationConfig = config.upload.location
  const fieldClass =
    'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500 focus:outline-none'
  const disabledFieldClass = `${fieldClass} cursor-not-allowed bg-gray-100 text-gray-500`
  const errorClass = 'mt-1 text-sm text-red-600'

  const getInitialLocationName = () => {
    const location = locationOptions.find((loc) => loc.value === locationId)
    return location?.name || ''
  }

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
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
      isDraft: false,
      activityDetails: null,
      fieldCharacteristics: null,
      access: null,
      facilities: null,
      schedule: null,
      requirements: null,
      participationFee: null,
      contact: null,
      organizer: null,
      startedDate: null,
      notes: null,
      other: null,
      meetingAddress: null,
      meetingTime: null,
      meetingMapUrl: null,
      meetingAdditionalInfo: null,
      gallery: null,
      attachments: null,
      upcomingDates: null
    }
  })

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLoading(true)
      setSuccess('')
      setError('')
      setSelectedMainImage(null)
      setSelectedGalleryImages([])
      setExistingGalleryImages([])
      setRemovedImages([])
      setSelectedAttachments([])
      setExistingAttachments([])
      setRemovedAttachments([])
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
            isDraft: location.status === 'draft',
            activityDetails: location.activityDetails || null,
            fieldCharacteristics: location.fieldCharacteristics || null,
            access: location.access || null,
            facilities: location.facilities || null,
            schedule: location.schedule || null,
            requirements: location.requirements || null,
            participationFee: location.participationFee || null,
            contact: location.contact || null,
            organizer: location.organizer || null,
            startedDate: location.startedDate || null,
            notes: location.notes || null,
            other: location.other || null,
            meetingAddress: location.meetingAddress || null,
            meetingTime: location.meetingTime || null,
            meetingMapUrl: location.meetingMapUrl || null,
            meetingAdditionalInfo: location.meetingAdditionalInfo || null,
            upcomingDates: location.upcomingDates || null
          })
          if (location.gallery && Array.isArray(location.gallery)) {
            setExistingGalleryImages(location.gallery as ImageAttachment[])
          }
          if (location.attachments && Array.isArray(location.attachments)) {
            setExistingAttachments(
              location.attachments as Array<{ name: string; filename: string; size: number }>
            )
          }
        }
      } catch (err) {
        console.log('新規登録モーダル', err)
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
      formData.append('isDraft', String(values.isDraft))

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
      if (values.organizer) formData.append('organizer', values.organizer)
      if (values.startedDate) formData.append('startedDate', values.startedDate)
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

      selectedGalleryImages.forEach((item, index) => {
        formData.append('gallery', item.file)
        if (item.caption) {
          formData.append(`gallery_caption_${index}`, item.caption)
        }
      })

      if (removedImages.length > 0) {
        formData.append('removedImages', JSON.stringify(removedImages))
      }

      if (removedAttachments.length > 0) {
        formData.append('removedAttachments', JSON.stringify(removedAttachments))
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
    const newImages = files.map((file) => ({ file, caption: '' }))
    setSelectedGalleryImages((prev) => [...prev, ...newImages])
  }

  const handleRemoveGalleryImage = (index: number) => {
    setSelectedGalleryImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGalleryCaptionChange = (index: number, caption: string) => {
    setSelectedGalleryImages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, caption } : item))
    )
  }

  const handleRemoveExistingImage = (imageFilename: string) => {
    setRemovedImages((prev) => [...prev, imageFilename])
    setExistingGalleryImages((prev) => prev.filter((img) => img.filename !== imageFilename))
  }

  const handleRemoveExistingAttachment = (attachmentFilename: string) => {
    setRemovedAttachments((prev) => [...prev, attachmentFilename])
    setExistingAttachments((prev) =>
      prev.filter((attachment) => attachment.filename !== attachmentFilename)
    )
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
      <div className="relative flex max-h-[90vh] w-full max-w-4xl transform flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
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
                {/* 基本情報 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">基本情報</h3>

                  <div className="mb-4">
                    <label htmlFor="id" className="mb-1 block font-medium text-gray-700">
                      ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="id"
                      type="text"
                      disabled
                      {...register('id')}
                      className={disabledFieldClass}
                    />
                    {errors.id && <p className={errorClass}>{errors.id.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="name" className="mb-1 block font-medium text-gray-700">
                      名称 <span className="text-red-500">*</span>
                    </label>
                    <input id="name" type="text" {...register('name')} className={fieldClass} />
                    {errors.name && <p className={errorClass}>{errors.name.message}</p>}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="position-lat"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        緯度
                      </label>
                      <Controller
                        name="position"
                        control={control}
                        render={({ field }) => (
                          <NumericFormat
                            id="position-lat"
                            value={field.value?.[0] || ''}
                            onValueChange={(values) => {
                              const lat = values.floatValue ?? 0
                              const lng = field.value?.[1] ?? 0
                              field.onChange([lat, lng])
                            }}
                            decimalScale={10}
                            allowNegative={true}
                            placeholder="例: 34.6937"
                            disabled={completed}
                            className={fieldClass}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="position-lng"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        経度
                      </label>
                      <Controller
                        name="position"
                        control={control}
                        render={({ field }) => (
                          <NumericFormat
                            id="position-lng"
                            value={field.value?.[1] || ''}
                            onValueChange={(values) => {
                              const lat = field.value?.[0] ?? 0
                              const lng = values.floatValue ?? 0
                              field.onChange([lat, lng])
                            }}
                            decimalScale={10}
                            allowNegative={true}
                            placeholder="例: 135.5023"
                            disabled={completed}
                            className={fieldClass}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {errors.position && <p className={errorClass}>{errors.position.message}</p>}

                  <div className="mb-4">
                    <label htmlFor="type" className="mb-1 block font-medium text-gray-700">
                      タイプ<span className="text-red-500">*</span>
                    </label>
                    <select id="type" {...register('type')} className={fieldClass}>
                      {locationTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className={errorClass}>{errors.type.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="address" className="mb-1 block font-medium text-gray-700">
                      住所
                    </label>
                    <input
                      id="address"
                      type="text"
                      {...register('address')}
                      className={fieldClass}
                    />
                    {errors.address && <p className={errorClass}>{errors.address.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="activities" className="mb-1 block font-medium text-gray-700">
                      活動内容(概要)
                    </label>
                    <textarea
                      id="activities"
                      rows={3}
                      {...register('activities')}
                      className={fieldClass}
                    />
                    {errors.activities && <p className={errorClass}>{errors.activities.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="image" className="mb-1 block font-medium text-gray-700">
                      メイン画像
                      <span className="group relative ml-2 inline-flex items-center text-gray-500">
                        <svg
                          className="h-4 w-4 cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="absolute bottom-full left-0 mb-2 hidden w-[300px] transform rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          <div className="space-y-2 whitespace-pre-wrap">
                            <div className="font-medium">対応ファイル形式</div>
                            <div>JPEG, PNG, GIF</div>
                            <div className="border-t border-gray-700 pt-2">
                              最大ファイルサイズ:{' '}
                              {Math.round(locationConfig.maxFileSize / (1024 * 1024))}MB
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                        </div>
                      </span>
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
                    <label
                      htmlFor="image"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        ></path>
                      </svg>
                      画像を選択
                      <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="hidden"
                      />
                    </label>
                    {errors.image && <p className={errorClass}>{errors.image.message}</p>}
                  </div>
                </div>

                {/* 公開設定 */}
                <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center">
                    <svg
                      className="mr-2 h-5 w-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-900">公開設定</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-lg border border-blue-200 bg-white p-3">
                      <label className="flex cursor-pointer items-start">
                        <input
                          type="checkbox"
                          {...register('hasDetail')}
                          className="text-primary-600 focus:ring-primary-500 mt-0.5 mr-3 h-5 w-5 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">詳細情報を公開する</div>
                          <p className="mt-1 text-sm text-gray-600">
                            活動情報・集合場所・アクセス情報などの詳細ページが公開されます
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-white p-3">
                      <label className="flex cursor-pointer items-start">
                        <input
                          type="checkbox"
                          {...register('isDraft')}
                          className="text-primary-600 focus:ring-primary-500 mt-0.5 mr-3 h-5 w-5 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">下書きとして保存</div>
                          <p className="mt-1 text-sm text-gray-600">
                            この活動地は下書き状態となり、一般には公開されません
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 活動情報 */}
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">活動情報</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="activityDetails"
                      className="mb-1 block font-medium text-gray-700"
                    >
                      活動の詳細
                    </label>
                    <textarea
                      id="activityDetails"
                      rows={4}
                      {...register('activityDetails')}
                      className={fieldClass}
                    />
                    {errors.activityDetails && (
                      <p className={errorClass}>{errors.activityDetails.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="fieldCharacteristics"
                      className="mb-1 block font-medium text-gray-700"
                    >
                      フィールドの特徴
                    </label>
                    <textarea
                      id="fieldCharacteristics"
                      rows={3}
                      {...register('fieldCharacteristics')}
                      className={fieldClass}
                    />
                    {errors.fieldCharacteristics && (
                      <p className={errorClass}>{errors.fieldCharacteristics.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="schedule" className="mb-1 block font-medium text-gray-700">
                      スケジュール
                    </label>
                    <input
                      id="schedule"
                      type="text"
                      {...register('schedule')}
                      placeholder="例: 毎週日曜日 9:00-12:00"
                      className={fieldClass}
                    />
                    {errors.schedule && <p className={errorClass}>{errors.schedule.message}</p>}
                  </div>
                </div>

                {/* 集合場所 */}
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">集合場所</h3>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingAddress"
                      className="mb-1 block font-medium text-gray-700"
                    >
                      集合場所の住所
                    </label>
                    <input
                      id="meetingAddress"
                      type="text"
                      {...register('meetingAddress')}
                      className={fieldClass}
                    />
                    {errors.meetingAddress && (
                      <p className={errorClass}>{errors.meetingAddress.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="meetingTime" className="mb-1 block font-medium text-gray-700">
                      集合時刻
                    </label>
                    <input
                      id="meetingTime"
                      type="text"
                      {...register('meetingTime')}
                      placeholder="例: 9:00"
                      className={fieldClass}
                    />
                    {errors.meetingTime && (
                      <p className={errorClass}>{errors.meetingTime.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="meetingMapUrl" className="mb-1 block font-medium text-gray-700">
                      地図URL
                    </label>
                    <input
                      id="meetingMapUrl"
                      type="text"
                      {...register('meetingMapUrl')}
                      placeholder="Google Maps等のURL"
                      className={fieldClass}
                    />
                    {errors.meetingMapUrl && (
                      <p className={errorClass}>{errors.meetingMapUrl.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="meetingAdditionalInfo"
                      className="mb-1 block font-medium text-gray-700"
                    >
                      補足情報
                    </label>
                    <textarea
                      id="meetingAdditionalInfo"
                      rows={3}
                      {...register('meetingAdditionalInfo')}
                      className={fieldClass}
                    />
                    {errors.meetingAdditionalInfo && (
                      <p className={errorClass}>{errors.meetingAdditionalInfo.message}</p>
                    )}
                  </div>
                </div>

                {/* アクセス・施設 */}
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">アクセス・施設</h3>

                  <div className="mb-4">
                    <label htmlFor="access" className="mb-1 block font-medium text-gray-700">
                      アクセス方法
                    </label>
                    <textarea id="access" rows={3} {...register('access')} className={fieldClass} />
                    {errors.access && <p className={errorClass}>{errors.access.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="facilities" className="mb-1 block font-medium text-gray-700">
                      施設情報
                    </label>
                    <textarea
                      id="facilities"
                      rows={3}
                      {...register('facilities')}
                      placeholder="例: トイレ有、駐車場10台"
                      className={fieldClass}
                    />
                    {errors.facilities && <p className={errorClass}>{errors.facilities.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="requirements" className="mb-1 block font-medium text-gray-700">
                      参加条件
                    </label>
                    <textarea
                      id="requirements"
                      rows={2}
                      {...register('requirements')}
                      className={fieldClass}
                    />
                    {errors.requirements && (
                      <p className={errorClass}>{errors.requirements.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="participationFee"
                      className="mb-1 block font-medium text-gray-700"
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
                      <p className={errorClass}>{errors.participationFee.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="contact" className="mb-1 block font-medium text-gray-700">
                      連絡先
                    </label>
                    <textarea
                      id="contact"
                      rows={2}
                      {...register('contact')}
                      className={fieldClass}
                    />
                    {errors.contact && <p className={errorClass}>{errors.contact.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="organizer" className="mb-1 block font-medium text-gray-700">
                      活動世話人
                    </label>
                    <input
                      id="organizer"
                      type="text"
                      {...register('organizer')}
                      placeholder="例: 山田太郎"
                      className={fieldClass}
                    />
                    {errors.organizer && <p className={errorClass}>{errors.organizer.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="startedDate" className="mb-1 block font-medium text-gray-700">
                      活動開始年月
                    </label>
                    <input
                      id="startedDate"
                      type="text"
                      {...register('startedDate')}
                      placeholder="例: 2020年4月"
                      className={fieldClass}
                    />
                    {errors.startedDate && (
                      <p className={errorClass}>{errors.startedDate.message}</p>
                    )}
                  </div>
                </div>

                {/* ギャラリー・添付ファイル */}
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    ギャラリー・添付ファイル
                  </h3>

                  <div className="mb-4">
                    <label htmlFor="gallery" className="mb-1 block font-medium text-gray-700">
                      ギャラリー画像
                      <span className="group relative ml-2 inline-flex items-center text-gray-500">
                        <svg
                          className="h-4 w-4 cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="absolute bottom-full left-0 mb-2 hidden w-[300px] transform rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          <div className="space-y-2 whitespace-pre-wrap">
                            <div className="font-medium">対応ファイル形式</div>
                            <div>JPEG, PNG, GIF</div>
                            <div className="border-t border-gray-700 pt-2">
                              最大ファイル数: {locationConfig.maxFiles}枚
                            </div>
                            <div>
                              最大ファイルサイズ:{' '}
                              {Math.round(locationConfig.maxFileSize / (1024 * 1024))}MB
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                        </div>
                      </span>
                    </label>

                    {existingGalleryImages.length > 0 && (
                      <div className="mb-2 grid grid-cols-3 gap-2">
                        {existingGalleryImages.map((image, index) => {
                          const imageUrl = image.filename.startsWith('http')
                            ? image.filename
                            : `${locationConfig.url}/${locationConfig.subDirectories?.gallery || 'gallery'}/${image.filename}`
                          return (
                            <div key={index} className="relative">
                              <img
                                src={imageUrl}
                                alt={image.caption || `既存画像${index + 1}`}
                                className="h-24 w-full rounded border border-gray-300 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingImage(image.filename)}
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
                              {image.caption && (
                                <div className="mt-1 text-xs text-gray-600">{image.caption}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {selectedGalleryImages.length > 0 && (
                      <div className="mb-2 space-y-3">
                        {selectedGalleryImages.map((item, index) => (
                          <div key={index} className="rounded border border-gray-300 p-3">
                            <div className="mb-2 flex items-start gap-3">
                              <img
                                src={URL.createObjectURL(item.file)}
                                alt={`新規画像${index + 1}`}
                                className="h-24 w-24 flex-shrink-0 rounded object-cover"
                              />
                              <div className="flex-1">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">
                                    {item.file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveGalleryImage(index)}
                                    className="rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
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
                                <div>
                                  <label
                                    htmlFor={`caption-${index}`}
                                    className="mb-1 block text-sm text-gray-600"
                                  >
                                    キャプション（任意、最大{locationConfig.captionMaxLength || 30}
                                    文字）
                                  </label>
                                  <input
                                    type="text"
                                    id={`caption-${index}`}
                                    value={item.caption}
                                    onChange={(e) =>
                                      handleGalleryCaptionChange(index, e.target.value)
                                    }
                                    maxLength={locationConfig.captionMaxLength || 30}
                                    className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-sm text-gray-900 focus:outline-none"
                                    placeholder="画像の説明を入力..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <label
                      htmlFor="gallery"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        ></path>
                      </svg>
                      画像を選択
                      <input
                        id="gallery"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryImagesChange}
                        className="hidden"
                      />
                    </label>
                    {errors.gallery && <p className={errorClass}>{errors.gallery.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="attachments" className="mb-1 block font-medium text-gray-700">
                      添付ファイル
                      <span className="group relative ml-2 inline-flex items-center text-gray-500">
                        <svg
                          className="h-4 w-4 cursor-help"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="absolute bottom-full left-0 mb-2 hidden w-[300px] transform rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                          <div className="space-y-2 whitespace-pre-wrap">
                            <div className="font-medium">対応ファイル形式</div>
                            <div>PDF, Word, Excel, JPEG, PNG, GIF</div>
                            <div className="border-t border-gray-700 pt-2">
                              最大ファイル数: {locationConfig.maxFiles}個
                            </div>
                            <div>
                              最大ファイルサイズ:{' '}
                              {Math.round(locationConfig.maxFileSize / (1024 * 1024))}MB
                            </div>
                          </div>
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                        </div>
                      </span>
                    </label>

                    {existingAttachments.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {existingAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded border border-gray-300 p-2 text-sm"
                          >
                            <a
                              href={`/api/location/download/${locationId}/${attachment.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {attachment.name} ({formatFileSize(attachment.size)})
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingAttachment(attachment.filename)}
                              className="text-red-600 hover:text-red-700"
                            >
                              削除
                            </button>
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

                    <label
                      htmlFor="attachments"
                      className="inline-flex cursor-pointer items-center rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        ></path>
                      </svg>
                      ファイルを選択
                      <input
                        id="attachments"
                        type="file"
                        multiple
                        onChange={handleAttachmentsChange}
                        className="hidden"
                      />
                    </label>
                    {errors.attachments && (
                      <p className={errorClass}>{errors.attachments.message}</p>
                    )}
                  </div>
                </div>

                {/* その他 */}
                <div className="mt-6 rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">その他</h3>

                  <div className="mb-4">
                    <label htmlFor="upcomingDates" className="mb-1 block font-medium text-gray-700">
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
                      <p className={errorClass}>{errors.upcomingDates.message}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="notes" className="mb-1 block font-medium text-gray-700">
                      注意事項
                    </label>
                    <textarea id="notes" rows={3} {...register('notes')} className={fieldClass} />
                    {errors.notes && <p className={errorClass}>{errors.notes.message}</p>}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="other" className="mb-1 block font-medium text-gray-700">
                      その他情報
                    </label>
                    <textarea id="other" rows={3} {...register('other')} className={fieldClass} />
                    {errors.other && <p className={errorClass}>{errors.other.message}</p>}
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
                type="button"
                variant="primary"
                disabled={isSubmitting}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault()
                  handleSubmit(onSubmit, () => {
                    setError('入力内容に誤りがあります。フォームを確認してください。')
                  })()
                }}
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
