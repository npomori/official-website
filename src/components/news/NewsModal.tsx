import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import DateRangePicker from '@/components/DateRangePicker'
import NewsCategoryDropdown from '@/components/news/NewsCategoryDropdown'
import NewsPriorityDropdown from '@/components/news/NewsPriorityDropdown'
import config from '@/config/config.json'
import AdminNewsFetch from '@/fetch/admin/news'
import { newsCreateSchema, type NewsCreate } from '@/schemas/news'
import type { NewsAttachment } from '@/types/news'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'

interface NewsModalProps {
  onClose: () => void
  onSuccess?: () => void
  news?: NewsCreate & { id?: string } // 編集時の既存データ
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
  } = useForm({
    resolver: zodResolver(newsCreateSchema),
    defaultValues: {
      title: '',
      content: '',
      date: new Date(),
      categories: [],
      priority: null,
      isMemberOnly: false,
      author: config.content.news.defaultAuthor || '未設定',
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
        isMemberOnly: news.isMemberOnly || false,
        author: news.author || config.content.news.defaultAuthor || '未設定',
        attachments: news.attachments || []
      })

      // 既存ファイルを設定
      if (news.attachments && news.attachments.length > 0) {
        // NewsAttachment型のみを設定
        const validAttachments = news.attachments.filter(
          (attachment): attachment is NewsAttachment =>
            typeof attachment === 'object' &&
            attachment !== null &&
            'originalName' in attachment &&
            'filename' in attachment
        )
        setExistingFiles(validAttachments)
      }
    } else {
      // フォームをリセット
      reset({
        title: '',
        content: '',
        date: new Date(),
        categories: [],
        priority: null,
        isMemberOnly: false,
        author: config.content.news.defaultAuthor || '未設定',
        attachments: []
      })
    }
  }, [reset, isEditMode, news])

  const onSubmit = async (values: NewsCreate) => {
    // メッセージリセット
    setSuccess('')
    setError('')

    try {
      if (!values.date) {
        setError('日付が設定されていません')
        return
      }

      // 日本時間に合わせて日付を設定
      //const dateString = values.date!.toISOString().split('T')[0]
      const dateString = values.date!.toLocaleString('sv-SE').split(' ')[0]

      if (isEditMode && news?.id) {
        // お知らせの更新の場合
        const result = await AdminNewsFetch.updateNews(parseInt(news.id), {
          title: values.title,
          content: values.content,
          date: dateString as string,
          categories: values.categories,
          priority: values.priority,
          isMemberOnly: values.isMemberOnly,
          author: values.author
        })

        if (result.success) {
          setSuccess('お知らせを更新しました')
          // 登録完了
          setCompleted(true)
        } else {
          // エラーメッセージの処理
          let errorMessage = result.message || 'お知らせの更新に失敗しました'

          // バリデーションエラーの場合、詳細なエラーメッセージを表示
          if (result.errors) {
            const errorDetails = Object.entries(result.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('\n')
            errorMessage = `${errorMessage}\n${errorDetails}`
          }

          setError(errorMessage)
          return // エラーの場合は処理を中断
        }
      } else {
        // 新規お知らせの追加の場合
        const formData = new FormData()
        formData.append('title', values.title)
        formData.append('content', values.content)
        formData.append('date', dateString as string)
        formData.append('categories', JSON.stringify(values.categories))
        formData.append('isMemberOnly', values.isMemberOnly.toString())
        formData.append('author', values.author)
        if (values.priority) {
          formData.append('priority', values.priority)
        }

        // 選択されたファイルを追加
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })

        const result = await AdminNewsFetch.createNewsWithFiles(formData)

        if (result.success) {
          setSuccess('お知らせを追加しました')
          // 登録完了
          setCompleted(true)
        } else {
          // エラーメッセージの処理
          let errorMessage = result.message || 'お知らせの追加に失敗しました'

          // バリデーションエラーの場合、詳細なエラーメッセージを表示
          if (result.errors) {
            const errorDetails = Object.entries(result.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join('\n')
            errorMessage = `${errorMessage}\n${errorDetails}`
          }

          setError(errorMessage)
          return // エラーの場合は処理を中断
        }
      }
    } catch (e: unknown) {
      console.error('News submission error:', e)
      const errorMessage = e instanceof Error ? e.message : '通信エラーが発生しました'
      setError(errorMessage)
    }
  }

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()

    // 登録完了後の「閉じる」ボタンの場合はページ更新を実行
    if (completed && onSuccess) {
      onSuccess()
    }

    onClose()
  }

  const onInvalid = (errors: FieldErrors<NewsCreate>) => {
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
      setRemovedFiles((prev) => [...prev, existingFile.filename])
    } else {
      // 新しいファイルの場合、selectedFilesから削除
      const fileIndex = selectedFiles.findIndex((file) => file.name === fileName)
      if (fileIndex !== -1) {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex))
      }
    }

    // フォームから削除
    const currentAttachments = watch('attachments') || []
    const updatedAttachments = currentAttachments.filter((_, i: number) => i !== index)
    setValue('attachments', updatedAttachments)
  }

  // 現在のファイル一覧を取得（削除されたファイルを除外）
  const getCurrentFiles = () => {
    const currentAttachments = watch('attachments') || []
    return currentAttachments.filter((file) => {
      if (typeof file === 'string') {
        return !removedFiles.includes(file)
      } else if (file && typeof file === 'object' && 'filename' in file) {
        return !removedFiles.includes(file.filename)
      }
      return true
    })
  }

  return (
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
            {isEditMode ? 'お知らせを編集' : 'お知らせを作成'}
          </h2>
        </div>

        {/* コンテンツ - スクロール可能 */}
        <div className="flex-1 overflow-y-auto px-6">
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
                      <div className="absolute top-full left-0 z-10 mt-2 hidden w-[300px] transform rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                        <div className="space-y-2 whitespace-pre-wrap">
                          <div>お知らせの公開日を設定します。</div>
                          <div>• 今日の日付を設定：すぐに公開されます</div>
                          <div>• 未来の日付を設定：その日が来るまで非表示になります</div>
                          <div>• 過去の日付を設定：すぐに公開されます</div>
                        </div>
                        <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
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
                  <label htmlFor="author" className="mb-1 block font-medium text-gray-900">
                    作成者
                  </label>
                  <input
                    type="text"
                    id="author"
                    {...register('author')}
                    className={`block w-full rounded-lg border ${
                      errors.author ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    required
                  />
                  {errors.author && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.author.message}</span>
                    </p>
                  )}
                </div>

                <div className="col-span-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isMemberOnly"
                      {...register('isMemberOnly')}
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isMemberOnly" className="ml-2 font-medium text-gray-900">
                      会員限定コンテンツ
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
                            <div>
                              チェックすると、ログイン中の会員のみがアクセスできるお知らせになります。
                            </div>
                            <div>• チェックあり：会員限定</div>
                            <div>• チェックなし：一般公開</div>
                          </div>
                          <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                        </div>
                      </span>
                    </label>
                  </div>
                  {errors.isMemberOnly && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.isMemberOnly.message}</span>
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
                          <div className="mt-4">
                            <div>リンク</div>
                            <div>---</div>
                            <div>[詳細はこちら](https://example.com/detail)</div>
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
                      <div className="absolute bottom-full left-0 mb-2 hidden w-[400px] transform rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                        <div className="space-y-2 whitespace-pre-wrap">
                          <div className="font-medium">対応ファイル形式</div>
                          <div>
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
                          </div>
                          <div className="border-t border-gray-700 pt-2">
                            最大ファイル数: {newsConfig.maxFiles}個
                          </div>
                          <div>
                            最大ファイルサイズ: {Math.round(newsConfig.maxFileSize / (1024 * 1024))}
                            MB
                          </div>
                        </div>
                        <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                      </div>
                    </span>
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
                      <div className="mt-3"></div>
                      {/* 選択されたファイル名の表示 */}
                      <Controller
                        name="attachments"
                        control={control}
                        render={() => (
                          <div>
                            {getCurrentFiles().length > 0 && (
                              <div className="mt-3 mb-4">
                                <p className="mb-2 text-sm font-medium text-gray-700">
                                  選択されたファイル:
                                </p>
                                <div className="space-y-1">
                                  {getCurrentFiles().map((file, index: number) => {
                                    const fileName =
                                      typeof file === 'string'
                                        ? file
                                        : file && typeof file === 'object' && 'originalName' in file
                                          ? file.originalName
                                          : 'unknown'
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
          </form>
        </div>

        {/* フッター - 固定 */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 pt-4 pb-6">
          <div className="flex justify-end space-x-3">
            {!completed && (
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                onClick={handleSubmit(onSubmit, onInvalid)}
              >
                {isEditMode ? '更新する' : '追加する'}
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
    </div>
  )
}

export default NewsModal
