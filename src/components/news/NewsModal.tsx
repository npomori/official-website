import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import DateRangePicker from '@/components/DateRangePicker'
import NewsCategoryDropdown from '@/components/news/NewsCategoryDropdown'
import NewsPriorityDropdown from '@/components/news/NewsPriorityDropdown'
import config from '@/config/config.json'
import adminNewsFetch from '@/fetch/admin/news'
import type { NewsAttachment } from '@/types/news'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { z } from 'zod'

// フィールドのスキーマを定義
const schema = z.object({
  title: z.string().trim().min(1, { message: 'タイトルは必須です' }),
  content: z.string().trim().min(1, { message: '内容は必須です' }),
  date: z.date({ message: '日付は必須です' }),
  categories: z.array(z.string()).min(1, { message: 'カテゴリーは必須です' }),
  priority: z.string().nullable(),
  attachments: z.array(z.any()).optional()
})

// フォームの入力値の型を上述のスキーマから作成
type FormValues = z.infer<typeof schema>

interface NewsModalProps {
  onClose: () => void
  onSuccess?: () => void
  news?: any // 編集時の既存データ
  isEditMode?: boolean
}

const NewsModal: React.FC<NewsModalProps> = ({ onClose, onSuccess, news, isEditMode = false }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false) // 登録完了フラグ
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // 選択されたファイル
  const [existingFiles, setExistingFiles] = useState<NewsAttachment[]>([]) // 既存ファイル
  const [removedFiles, setRemovedFiles] = useState<string[]>([]) // 削除されたファイル

  // お知らせの設定を直接取得
  const newsConfig = config.upload.news

  const {
    control,
    register,
    reset,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      content: '',
      date: new Date(),
      categories: [],
      priority: null,
      attachments: []
    }
  })

  useEffect(() => {
    // メッセージリセット
    setSuccess('')
    setError('')
    setCompleted(false)
    setSelectedFiles([])
    setExistingFiles([])
    setRemovedFiles([])

    if (isEditMode && news) {
      // 編集モードの場合、既存データをフォームに設定
      reset({
        title: news.title || '',
        content: news.content || '',
        date: news.date ? new Date(news.date) : new Date(),
        categories: news.categories || [],
        priority: news.priority || null,
        attachments: news.attachments || []
      })

      // 既存ファイルを設定
      if (news.attachments && news.attachments.length > 0) {
        setExistingFiles(news.attachments)
      }
    } else {
      // フォームをリセット
      reset({
        title: '',
        content: '',
        date: new Date(),
        categories: [],
        priority: null,
        attachments: []
      })
    }
  }, [reset, isEditMode, news])

  const onSubmit = async (values: any) => {
    // メッセージリセット
    setSuccess('')
    setError('')

    try {
      if (isEditMode && news) {
        // お知らせの更新の場合
        await adminNewsFetch.updateNews(news.id, {
          title: values.title,
          content: values.content,
          date: values.date.toISOString().split('T')[0],
          categories: values.categories,
          priority: values.priority,
          attachments: values.attachments || []
        })
        setSuccess('お知らせを更新しました')
      } else {
        // 新規お知らせの追加の場合
        const formData = new FormData()
        formData.append('title', values.title)
        formData.append('content', values.content)
        formData.append('date', values.date.toISOString().split('T')[0])
        formData.append('categories', JSON.stringify(values.categories))
        if (values.priority) {
          formData.append('priority', values.priority)
        }

        // 選択されたファイルを追加
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        await adminNewsFetch.createNewsWithFiles(formData)
        setSuccess('お知らせを追加しました')
      }

      // 登録完了
      setCompleted(true)

      // 成功時のコールバックを呼び出し
      if (onSuccess) {
        onSuccess()
      }
    } catch (e: any) {
      console.error('News submission error:', e)
      setError(e.message || '通信エラーが発生しました')
    }
  }

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    onClose()
  }

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    // デバッグ用
    console.log('バリデーションエラー発生')
    console.log(errors)
  }

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      // ファイル数のバリデーション
      const currentFiles = selectedFiles.length + existingFiles.length - removedFiles.length
      if (currentFiles + files.length > newsConfig.maxFiles) {
        setError(`ファイル数が多すぎます (最大${newsConfig.maxFiles}個)`)
        return
      }

      // ファイルサイズとタイプのバリデーション
      for (const file of files) {
        if (file.size > newsConfig.maxFileSize) {
          const maxSizeMB = Math.round(newsConfig.maxFileSize / (1024 * 1024))
          setError(`ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`)
          return
        }

        if (!newsConfig.allowedTypes.includes(file.type)) {
          setError(`ファイルタイプが許可されていません: ${file.name}`)
          return
        }
      }

      setSelectedFiles((prev) => [...prev, ...files])

      // ファイル名をフォームに設定
      const fileNames = files.map((file) => file.name)
      const currentAttachments = watch('attachments') || []
      setValue('attachments', [...currentAttachments, ...fileNames])
    }
  }

  // ファイル削除ハンドラー
  const removeFile = (fileName: string, index: number) => {
    // 既存ファイルか新しいファイルかを判定
    const existingFile = existingFiles.find((file) => file.originalName === fileName)
    if (existingFile) {
      // 既存ファイルの場合、削除リストに追加
      setRemovedFiles((prev) => [...prev, existingFile.serverName])
    } else {
      // 新しいファイルの場合、selectedFilesから削除
      const fileIndex = selectedFiles.findIndex((file) => file.name === fileName)
      if (fileIndex !== -1) {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex))
      }
    }

    // フォームから削除
    const currentAttachments = watch('attachments') || []
    const updatedAttachments = currentAttachments.filter((_, i) => i !== index)
    setValue('attachments', updatedAttachments)
  }

  // 現在のファイル一覧を取得（削除されたファイルを除外）
  const getCurrentFiles = () => {
    const currentAttachments = watch('attachments') || []
    return currentAttachments.filter((file) => {
      if (typeof file === 'string') {
        return !removedFiles.includes(file)
      } else {
        return !removedFiles.includes(file.serverName)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50">
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
        {/* ヘッダー */}
        <div className="relative px-6 pt-6">
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
            {isEditMode ? 'お知らせを編集' : 'お知らせを作成'}
          </h2>
        </div>
        {/* コンテンツ */}
        <div className="px-6 pt-0 pb-6">
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
            {success && <Alert message={success} type="success" />}
            {error && <Alert message={error} type="error" />}

            <fieldset disabled={completed}>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <label htmlFor="title" className="mb-1 block font-medium text-gray-900">
                    タイトル
                  </label>
                  <input
                    type="text"
                    id="title"
                    {...register('title')}
                    className={`block w-full rounded-lg border ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.title.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <label htmlFor="date" className="mb-1 block font-medium text-gray-900">
                    日付
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
                          <div>お知らせの公開日を設定します。</div>
                          <div>• 今日の日付を設定：すぐに公開されます</div>
                          <div>• 未来の日付を設定：その日が来るまで非表示になります</div>
                          <div>• 過去の日付を設定：すぐに公開されます</div>
                        </div>
                        <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                      </div>
                    </span>
                  </label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <DateRangePicker
                        startDate={value}
                        endDate={value}
                        onChange={(startDate) => onChange(startDate)}
                        isRangeMode={false}
                        placeholder="日付を選択"
                        showWeekday={true}
                      />
                    )}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.date.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <label htmlFor="categories" className="mb-1 block font-medium text-gray-900">
                    カテゴリー
                  </label>
                  <Controller
                    name="categories"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <NewsCategoryDropdown
                        id="categories"
                        selectedCategories={value}
                        onChange={onChange}
                      />
                    )}
                  />
                  {errors.categories && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.categories.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <label htmlFor="priority" className="mb-1 block font-medium text-gray-900">
                    優先度
                  </label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <NewsPriorityDropdown
                        id="priority"
                        selectedPriority={value}
                        onChange={onChange}
                      />
                    )}
                  />
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.priority.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <label htmlFor="content" className="mb-1 block font-medium text-gray-900">
                    内容
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
                        <div className="mb-2 border-b border-gray-700 pb-2 font-medium">
                          表記サンプル(Markdown記法)
                        </div>
                        <div className="space-y-2 whitespace-pre-wrap">
                          <div>
                            <div>お知らせ内容</div>
                            <div>---</div>
                            <div>このお知らせでは、重要な情報について説明いたします。</div>
                          </div>
                          <div className="mt-4">
                            <div>詳細</div>
                            <div>---</div>
                            <div>- 開催日時: 2024年1月15日</div>
                            <div>- 場所: 会議室A</div>
                            <div>- 参加費: 無料</div>
                          </div>
                        </div>
                        <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                      </div>
                    </span>
                  </label>
                  <textarea
                    id="content"
                    {...register('content')}
                    rows={8}
                    className={`block w-full rounded-lg border ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  ></textarea>
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.content.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-900">
                    添付ファイル(オプション)
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex w-full items-start">
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
                            className="hidden"
                            accept={newsConfig.allowedTypes.join(',')}
                            onChange={handleFileSelect}
                            disabled={completed}
                          />
                        </label>
                      </div>
                      <p className="mt-3 text-sm text-gray-500">
                        対応形式:{' '}
                        {newsConfig.allowedTypes
                          .map((type: string) => {
                            const extensions: Record<string, string> = {
                              'application/pdf': 'PDF',
                              'application/msword': 'Word (.doc)',
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                                'Word (.docx)',
                              'application/vnd.ms-excel': 'Excel (.xls)',
                              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                                'Excel (.xlsx)',
                              'image/jpeg': 'JPEG',
                              'image/png': 'PNG',
                              'image/gif': 'GIF'
                            }
                            return extensions[type] || type
                          })
                          .join(', ')}
                        <br />
                        最大ファイル数: {newsConfig.maxFiles}個, 最大ファイルサイズ:{' '}
                        {Math.round(newsConfig.maxFileSize / (1024 * 1024))}MB
                      </p>
                      {/* 選択されたファイル名の表示 */}
                      <Controller
                        name="attachments"
                        control={control}
                        render={({ field: { value } }) => (
                          <div>
                            {getCurrentFiles().length > 0 && (
                              <div className="mt-3">
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                  選択されたファイル:
                                </p>
                                <div className="space-y-1">
                                  {getCurrentFiles().map((file: any, index: number) => {
                                    const fileName =
                                      typeof file === 'string' ? file : file.originalName
                                    return (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-2"
                                      >
                                        <div className="flex items-center">
                                          <svg
                                            className="mr-2 h-4 w-4 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                          </svg>
                                          <span className="text-sm text-gray-700">{fileName}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeFile(fileName, index)}
                                          className="ml-2 rounded-full bg-red-500 p-1 text-white transition-colors hover:bg-red-600"
                                          disabled={completed}
                                          title="削除"
                                        >
                                          <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                  {errors.attachments && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.attachments.message}</span>
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* モーダルフッタ部 */}
            <div className="flex justify-end space-x-3 pt-4">
              {!completed && (
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isEditMode ? '更新する' : '追加する'}
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

export default NewsModal
