import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import DateRangePicker from '@/components/DateRangePicker'
import recordCategories from '@/config/record-category.json'
import adminRecordFetch from '@/fetch/admin/record'
import { RecordDataSchema, safeValidateRecordData } from '@/schemas/record'
import { getRecordUploadConfig } from '@/types/config'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { z } from 'zod'

// フォームの入力値の型をスキーマから作成
type FormValues = z.infer<typeof RecordDataSchema>

interface RecordModalProps {
  onClose: () => void
  onSuccess?: () => void
  record?: any // 編集時の既存データ
  isEditMode?: boolean
}

const RecordModal: React.FC<RecordModalProps> = ({
  onClose,
  onSuccess,
  record,
  isEditMode = false
}) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [additionalText, setAdditionalText] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]) // 既存画像のURL
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]) // 削除された既存画像
  const dateRangePickerRef = useRef<HTMLDivElement>(null)

  // 設定を取得
  const recordConfig = getRecordUploadConfig()

  const {
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(RecordDataSchema),
    defaultValues: {
      location: '',
      datetime: '',
      weather: '',
      participants: '',
      reporter: '',
      content: '',
      nearMiss: '',
      equipment: '',
      remarks: '',
      categories: [],
      images: []
    }
  })

  // フォーカス制御用
  const rangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // メッセージリセット
    setSuccess('')
    setError('')
    setCompleted(false)
    setSelectedDate(null)
    setAdditionalText('')
    setSelectedImages([])
    setImagePreviewUrls([])
    setExistingImageUrls([])
    setRemovedExistingImages([])

    if (isEditMode && record) {
      // 編集モードの場合、既存データをフォームに設定
      setValue('location', record.location || '')
      setValue('datetime', record.datetime || '')
      setValue('weather', record.weather || '')
      setValue('participants', record.participants || '')
      setValue('reporter', record.reporter || '')
      setValue('content', record.content || '')
      setValue('nearMiss', record.nearMiss || '')
      setValue('equipment', record.equipment || '')
      setValue('remarks', record.remarks || '')
      setValue('categories', record.categories || [])

      // 既存の画像をプレビューに設定
      if (record.images && record.images.length > 0) {
        const recordConfig = getRecordUploadConfig()
        const imageUrls = record.images.map((image: string) => `${recordConfig.url}/${image}`)
        setImagePreviewUrls(imageUrls)
        setExistingImageUrls(imageUrls) // 既存画像のURLを保存
      }
    } else {
      // フォームをリセット
      reset()
    }
  }, [reset, isEditMode, record, setValue])

  const onSubmit = async (values: FormValues) => {
    // メッセージリセット
    setSuccess('')
    setError('')

    try {
      // 送信前にtrim処理
      let finalImages: string[] = []
      if (isEditMode && record?.images) {
        // 編集モードの場合、削除された画像を除外
        finalImages = record.images.filter(
          (image: string) => !removedExistingImages.includes(image)
        )
      }

      const trimmedData = {
        location: values.location.trim(),
        datetime: values.datetime.trim(),
        weather: values.weather.trim(),
        participants: values.participants.trim(),
        reporter: values.reporter.trim(),
        content: values.content.trim(),
        nearMiss: values.nearMiss?.trim() || undefined,
        equipment: values.equipment?.trim() || undefined,
        remarks: values.remarks?.trim() || undefined,
        categories: values.categories,
        images: finalImages
      }

      // クライアント側バリデーション
      const validationResult = safeValidateRecordData(trimmedData)
      if (!validationResult.success) {
        setError(validationResult.error)
        return
      }

      // 選択された日付をファイル名用の形式で送信
      const dateForFilename = selectedDate
        ? format(selectedDate, 'yyyyMMdd')
        : format(new Date(), 'yyyyMMdd')

      try {
        let responseData
        if (isEditMode && record) {
          // 編集モードの場合
          responseData = await adminRecordFetch.updateRecordWithImages(record.id, {
            data: validationResult.data,
            images: selectedImages
          })
        } else {
          // 新規作成モードの場合
          const dateForFilename = selectedDate
            ? format(selectedDate, 'yyyyMMdd')
            : format(new Date(), 'yyyyMMdd')

          responseData = await adminRecordFetch.createRecordWithImages({
            dateForFilename,
            data: validationResult.data,
            images: selectedImages
          })
        }

        setSuccess(
          responseData.message || (isEditMode ? '活動記録を更新しました' : '活動記録を追加しました')
        )
        setCompleted(true)
        // 成功時のコールバックを呼び出し
        if (onSuccess) {
          onSuccess()
        }
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : isEditMode
              ? '活動記録の更新に失敗しました'
              : '活動記録の追加に失敗しました'
        )
      }
    } catch (err) {
      setError('通信エラーが発生しました')
      console.error('Record error:', err)
    }
  }

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    onClose()
  }

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    console.log('バリデーションエラー発生')
    console.log(errors)
  }

  // カテゴリーの選択状態を管理
  const selectedCategories = watch('categories')

  const handleCategoryChange = (categoryValue: string, checked: boolean) => {
    const currentCategories = selectedCategories || []
    if (checked) {
      setValue('categories', [...currentCategories, categoryValue])
    } else {
      setValue(
        'categories',
        currentCategories.filter((cat) => cat !== categoryValue)
      )
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files])

      // プレビューURLを生成
      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    const imageUrl = imagePreviewUrls[index]

    if (!imageUrl) return

    // 既存画像か新しい画像かを判定
    if (existingImageUrls.includes(imageUrl)) {
      // 既存画像の場合、削除リストに追加
      const imageFileName = imageUrl.split('/').pop()
      if (imageFileName) {
        setRemovedExistingImages((prev) => [...prev, imageFileName])
      }
    } else {
      // 新しい画像の場合、selectedImagesから削除
      const newImageIndex = index - existingImageUrls.length + removedExistingImages.length
      setSelectedImages((prev) => prev.filter((_, i) => i !== newImageIndex))
    }

    // プレビューから削除
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-4">
      <div className="relative flex h-[90vh] w-full max-w-4xl transform flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
        {/* ヘッダー */}
        <div className="relative flex-shrink-0 px-6 pt-6">
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
            {isEditMode ? '活動記録を編集' : '活動記録を追加'}
          </h2>
        </div>

        {/* メッセージ表示エリア */}
        <div className="flex-shrink-0 px-6">
          {success && <Alert message={success} type="success" />}
          {error && <Alert message={error} type="error" />}
        </div>

        {/* スクロール可能なコンテンツエリア */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6">
            <fieldset disabled={completed}>
              <div className="grid grid-cols-4 gap-4">
                {/* 活動場所 */}
                <div className="col-span-4">
                  <label htmlFor="location" className="mb-1 block font-medium text-gray-900">
                    活動場所 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    {...register('location')}
                    placeholder="例：箕面国有林"
                    className={`block w-full rounded-lg border ${
                      errors.location ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.location.message}</span>
                    </p>
                  )}
                </div>

                {/* 活動日時 */}
                <div className="col-span-4">
                  <label htmlFor="datetime" className="mb-1 block font-medium text-gray-900">
                    活動日 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-1/2">
                      <DateRangePicker
                        startDate={selectedDate}
                        endDate={selectedDate}
                        onChange={(startDate, endDate) => {
                          setSelectedDate(startDate)
                          // DateRangePickerが閉じるのを待ってから処理を実行
                          setTimeout(() => {
                            if (startDate instanceof Date && !isNaN(startDate.getTime())) {
                              const dateStr = format(startDate, 'yyyy年M月d日(E)', { locale: ja })
                              const fullValue = additionalText
                                ? `${dateStr} ${additionalText}`
                                : dateStr
                              setValue('datetime', fullValue)
                              // エラーをクリア
                              clearErrors('datetime')
                            } else {
                              setValue('datetime', '')
                            }
                          }, 50)
                        }}
                        isRangeMode={false}
                        placeholder="日付を選択"
                        showWeekday={true}
                        ref={dateRangePickerRef}
                      />
                    </div>
                    <div className="w-1/2">
                      <input
                        type="text"
                        value={additionalText}
                        onChange={(e) => {
                          setAdditionalText(e.target.value)
                          if (selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
                            const dateStr = format(selectedDate, 'yyyy年M月d日(E)', { locale: ja })
                            const fullValue = e.target.value
                              ? `${dateStr} ${e.target.value}`
                              : dateStr
                            setValue('datetime', fullValue)
                            // エラーをクリア
                            clearErrors('datetime')
                          }
                        }}
                        placeholder="任意の文字列を入力（例：午前9時から）"
                        disabled={!selectedDate}
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  {watch('datetime') && (
                    <div className="mt-1 text-sm text-gray-600">入力値: {watch('datetime')}</div>
                  )}
                  {errors.datetime && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.datetime.message}</span>
                    </p>
                  )}
                </div>

                {/* 天候 */}
                <div className="col-span-4">
                  <label htmlFor="weather" className="mb-1 block font-medium text-gray-900">
                    天候 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="weather"
                    {...register('weather')}
                    placeholder="例：晴れ、気温12℃"
                    className={`block w-full rounded-lg border ${
                      errors.weather ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.weather && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.weather.message}</span>
                    </p>
                  )}
                </div>

                {/* 参加者 */}
                <div className="col-span-4">
                  <label htmlFor="participants" className="mb-1 block font-medium text-gray-900">
                    参加者 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="participants"
                    {...register('participants')}
                    placeholder="例：48名（一般参加者35名、スタッフ13名）"
                    className={`block w-full rounded-lg border ${
                      errors.participants ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.participants && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.participants.message}</span>
                    </p>
                  )}
                </div>

                {/* 報告者 */}
                <div className="col-span-4">
                  <label htmlFor="reporter" className="mb-1 block font-medium text-gray-900">
                    報告者 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="reporter"
                    {...register('reporter')}
                    placeholder="例：大阪太郎"
                    className={`block w-full rounded-lg border ${
                      errors.reporter ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.reporter && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.reporter.message}</span>
                    </p>
                  )}
                </div>

                {/* 活動内容 */}
                <div className="col-span-4">
                  <label htmlFor="content" className="mb-1 block font-medium text-gray-900">
                    活動内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    {...register('content')}
                    placeholder="実施した活動の詳細を入力してください"
                    rows={4}
                    className={`block w-full resize-y rounded-lg border ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.content.message}</span>
                    </p>
                  )}
                </div>

                {/* ヒヤリハット */}
                <div className="col-span-4">
                  <label htmlFor="nearMiss" className="mb-1 block font-medium text-gray-900">
                    ヒヤリハット
                  </label>
                  <textarea
                    id="nearMiss"
                    {...register('nearMiss')}
                    placeholder="危険な状況や事故になりそうだった事例があれば入力してください"
                    rows={3}
                    className={`block w-full resize-y rounded-lg border ${
                      errors.nearMiss ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                  />
                  {errors.nearMiss && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.nearMiss.message}</span>
                    </p>
                  )}
                </div>

                {/* 動力使用 */}
                <div className="col-span-4">
                  <label htmlFor="equipment" className="mb-1 block font-medium text-gray-900">
                    動力使用
                  </label>
                  <input
                    type="text"
                    id="equipment"
                    {...register('equipment')}
                    placeholder="例：チェーンソー、刈払機"
                    className={`block w-full rounded-lg border ${
                      errors.equipment ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                  />
                  {errors.equipment && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.equipment.message}</span>
                    </p>
                  )}
                </div>

                {/* 備考 */}
                <div className="col-span-4">
                  <label htmlFor="remarks" className="mb-1 block font-medium text-gray-900">
                    備考
                  </label>
                  <textarea
                    id="remarks"
                    {...register('remarks')}
                    placeholder="その他の特記事項があれば入力してください"
                    rows={3}
                    className={`block w-full resize-y rounded-lg border ${
                      errors.remarks ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                  />
                  {errors.remarks && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.remarks.message}</span>
                    </p>
                  )}
                </div>

                {/* カテゴリー */}
                <div className="col-span-4 mb-6">
                  <label className="mb-1 block font-medium text-gray-900">カテゴリー</label>
                  <div className="grid grid-cols-4 gap-3">
                    {recordCategories.map((category) => (
                      <label key={category.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories?.includes(category.value) || false}
                          onChange={(e) => handleCategoryChange(category.value, e.target.checked)}
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.categories && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.categories.message}</span>
                    </p>
                  )}
                </div>

                {/* 画像アップロード */}
                {recordConfig.enabled && (
                  <div className="col-span-4 mb-6">
                    <label className="mb-1 block font-medium text-gray-900">活動写真</label>
                    <div className="space-y-4">
                      <div>
                        <div className="flex w-full items-start">
                          <label
                            htmlFor="record-images"
                            className="inline-flex cursor-pointer items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
                              id="record-images"
                              type="file"
                              accept={recordConfig.allowedTypes.join(',')}
                              multiple
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={completed}
                            />
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {recordConfig.allowedTypes
                            .map((type) => {
                              const ext = type.split('/')[1]?.toUpperCase() || type
                              return ext
                            })
                            .join('、')}
                          形式の画像ファイルを選択してください（最大{recordConfig.maxFiles}個、
                          {Math.round(recordConfig.maxFileSize / (1024 * 1024))}MB以下）
                        </p>
                      </div>

                      {/* 画像プレビュー */}
                      {imagePreviewUrls.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative h-24 w-24">
                              <img
                                src={url}
                                alt={`プレビュー ${index + 1}`}
                                className="h-full w-full rounded-lg object-cover shadow-md"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-lg transition-colors hover:bg-red-600"
                                disabled={completed}
                                title="削除"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </fieldset>
          </div>
        </div>

        {/* モーダルフッタ部（スクロール外） */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
            <div className="flex justify-end space-x-3">
              {!completed && (
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting
                    ? isEditMode
                      ? '更新中...'
                      : '追加中...'
                    : isEditMode
                      ? '更新する'
                      : '追加する'}
                </Button>
              )}
              {completed && (
                <Button type="button" variant="default" onClick={handleCancel}>
                  閉じる
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RecordModal
