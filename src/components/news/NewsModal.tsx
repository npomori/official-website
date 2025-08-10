import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import DateRangePicker from '@/components/DateRangePicker'
import NewsCategoryDropdown from '@/components/news/NewsCategoryDropdown'
import NewsPriorityDropdown from '@/components/news/NewsPriorityDropdown'
import newsFetch from '@/fetch/news'
import { modalNewsId, notifyNewsUpdate, showNewsModal } from '@/store/news'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStore } from '@nanostores/react'
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
  attachments: z.array(z.string()).optional()
})

// フォームの入力値の型を上述のスキーマから作成
type FormValues = z.infer<typeof schema>

interface NewsModalProps {
  onClose: () => void
}

const NewsModal: React.FC<NewsModalProps> = ({ onClose }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false) // 登録完了フラグ
  const isModalVisible = useStore(showNewsModal)
  const newsId = useStore(modalNewsId)

  const {
    control,
    register,
    reset,
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

    if (newsId === 0) {
      // フォームをリセット
      reset({
        title: '',
        content: '',
        date: new Date(),
        categories: [],
        priority: null,
        attachments: []
      })
    } else {
      // お知らせ情報を取得
      ;(async () => {
        try {
          const newsData = await newsFetch.getNewsById(newsId)

          // フォームの初期値を設定
          reset({
            title: newsData.title,
            content: newsData.content,
            date: new Date(newsData.date),
            categories: newsData.categories || [],
            priority: newsData.priority || null,
            attachments: newsData.attachments || []
          })
        } catch (e) {
          console.error(e)
          setError('通信エラーが発生しました')
        }
      })()
    }
  }, [newsId, reset])

  const onSubmit = async (values: any) => {
    // メッセージリセット
    setSuccess('')
    setError('')

    try {
      if (newsId === 0) {
        // 新規お知らせの追加の場合
        await newsFetch.createNews({
          title: values.title,
          content: values.content,
          date: values.date.toISOString().split('T')[0],
          categories: values.categories,
          priority: values.priority,
          attachments: values.attachments || []
        })
        setSuccess('お知らせを追加しました')
      } else {
        // お知らせの更新の場合
        await newsFetch.updateNews(newsId, {
          title: values.title,
          content: values.content,
          date: values.date.toISOString().split('T')[0],
          categories: values.categories,
          priority: values.priority,
          attachments: values.attachments || []
        })
        setSuccess('お知らせを更新しました')
      }

      // 登録完了
      setCompleted(true)

      // お知らせの更新を通知
      notifyNewsUpdate()
    } catch (e: any) {
      console.error('News submission error:', e)
      setError(e.message || '通信エラーが発生しました')
    }
  }

  const handleCancel: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    showNewsModal.set(false)
    onClose()
  }

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    // デバッグ用
    console.log('バリデーションエラー発生')
    console.log(errors)
  }

  if (!isModalVisible) return null

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
            {newsId ? 'お知らせを編集' : 'お知らせを作成'}
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
                  <label htmlFor="attachments" className="mb-1 block font-medium text-gray-900">
                    添付ファイル(オプション)
                  </label>
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    className={`block w-full rounded-lg border ${
                      errors.attachments ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      const fileNames = files.map((file) => file.name)
                      setValue('attachments', fileNames)
                    }}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    対応形式: PDF, Word, Excel, 画像ファイル (JPG, PNG, GIF)
                  </p>
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
                  {newsId ? '更新する' : '追加する'}
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
