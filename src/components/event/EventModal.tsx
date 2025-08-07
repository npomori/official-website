import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import DateRangePicker from '@/components/DateRangePicker'
import ColorDropdown from '@/components/event/ColorDropdown'
import { AdminEventFetch } from '@/fetch/admin'
import { modalEventId, notifyEventUpdate, showEventModal } from '@/store/event'
import { zodResolver } from '@hookform/resolvers/zod'
import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { z } from 'zod'

// フィールドのスキーマを定義
const schema = z
  .object({
    title: z.string().trim().min(1, { message: 'イベント名は必須です' }),
    eventDate: z
      .object({
        startDate: z
          .date({
            invalid_type_error: '開始日の形式が正しくありません',
            required_error: '開始日は必須です'
          })
          .nullable(),
        endDate: z
          .date({
            invalid_type_error: '終了日の形式が正しくありません',
            required_error: '終了日は必須です'
          })
          .nullable()
      })
      .refine((data) => data.startDate !== null && data.endDate !== null, {
        message: '日付は必須です',
        path: ['startDate']
      }),
    isTimeSettingEnabled: z.boolean(),
    eventTimeStart: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '開始時間はhh:mm形式で入力してください' })
      .or(z.literal('')),
    eventTimeEnd: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: '終了時間はhh:mm形式で入力してください' })
      .or(z.literal('')),
    category: z.string(),
    description: z.string().trim().optional().or(z.literal('')),
    url: z
      .string()
      .trim()
      .url({ message: 'URLが不正です' })
      .refine((val) => !val || val.startsWith('http://') || val.startsWith('https://'), {
        message: 'URLはhttp://またはhttps://で始まる必要があります'
      })
      .optional()
      .or(z.literal(''))
  })
  .refine(
    (data) => {
      if (data.isTimeSettingEnabled) {
        return Boolean(data.eventTimeStart)
      }
      return true
    },
    {
      message: '開始時刻は必須です',
      path: ['eventTimeStart']
    }
  )
  .refine(
    (data) => {
      if (data.isTimeSettingEnabled) {
        // 開始日と終了日が同じ場合、終了時刻は任意
        if (data.eventDate.startDate?.getTime() === data.eventDate.endDate?.getTime()) {
          return true
        }

        // 日付が異なる場合は終了時刻も必須
        return Boolean(data.eventTimeEnd)
      }
      return true
    },
    {
      message: '終了時刻は必須です',
      path: ['eventTimeEnd']
    }
  )

// フォームの入力値の型を上述のスキーマから作成
type FormValues = z.infer<typeof schema>

interface EventModalProps {
  onClose: () => void
}

const EventModal: React.FC<EventModalProps> = ({ onClose }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false) // 登録完了フラグ
  const isModalVisible = useStore(showEventModal)
  const eventId = useStore(modalEventId)

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

    // 初期値を設定
    defaultValues: {
      title: '',
      eventDate: {
        startDate: null, // 初期値を設定
        endDate: null
      },
      isTimeSettingEnabled: false, // 時間設定を初期状態では無効に
      eventTimeStart: '', // 時間設定が無効な場合の初期値
      eventTimeEnd: '', // 時間設定が無効な場合の初期値
      category: '', // カテゴリーデフォルト値
      description: '',
      url: ''
    }
  })

  // フォーカス制御用
  const rangeRef = useRef<HTMLDivElement>(null)

  // 時間設定(オプション)を監視
  const isTimeSettingEnabled = watch('isTimeSettingEnabled')

  useEffect(() => {
    // メッセージリセット
    setSuccess('')
    setError('')
    setCompleted(false)

    if (eventId === 0) {
      // フォームをリセット
      reset()
    } else {
      // イベント情報を取得
      // eslint-disable-next-line no-extra-semi
      ;(async () => {
        try {
          const response = await AdminEventFetch.getEvent(eventId)
          if (!response.ok) {
            const errorData = await response.json()
            setError(`データの取得に失敗しました: ${errorData.message}`)
            return
          }
          const eventData = await response.json()

          // 開始日と終了日を取得
          const startDate = new Date(eventData.start.split('T')[0])
          const endDate = new Date(eventData.end.split('T')[0])
          if (eventData.allDay) {
            // 終日イベントの場合、終了日を1日前に設定
            endDate.setDate(endDate.getDate() - 1)
          }

          // 開始日の開始時間と終了日の終了時間をhh:mm形式で取得
          let eventTimeStart = ''
          let eventTimeEnd = ''
          if (!eventData.allDay) {
            if (eventData.start.includes('T')) {
              eventTimeStart = _convertTimeToHHMM(eventData.start.split('T')[1])
            }
            // 開始日時と終了日時が同じ場合は終了時間を設定しない
            if (startDate.getTime() !== endDate.getTime() && eventData.end.includes('T')) {
              eventTimeEnd = _convertTimeToHHMM(eventData.end.split('T')[1])
            }
          }

          // フォームの初期値を設定
          reset({
            title: eventData.title,
            description: eventData.description,
            eventDate: {
              startDate: startDate,
              endDate: endDate
            },
            isTimeSettingEnabled: !eventData.allDay, // 終日イベントかどうか
            eventTimeStart: eventTimeStart,
            eventTimeEnd: eventTimeEnd,
            category: eventData.category || '', // categoryIdをcategoryに変更
            url: eventData.url
          })
        } catch (e) {
          console.error(e)
          setError('通信エラーが発生しました')
        }
      })()
    }
  }, [eventId, reset])

  const onSubmit = async (values: FormValues) => {
    let start, end
    let response

    // メッセージリセット
    setSuccess('')
    setError('')

    if (isTimeSettingEnabled) {
      start = `${values.eventDate.startDate!.toLocaleString('sv-SE').split(' ')[0]}T${values.eventTimeStart}`

      // 終了時刻が設定されている場合はそれを使用、ない場合は開始時刻を使用
      const endTime = values.eventTimeEnd || values.eventTimeStart
      end = `${values.eventDate.endDate!.toLocaleString('sv-SE').split(' ')[0]}T${endTime}`
    } else {
      // 終日イベントの場合の処理（既存のまま）
      const endDate = new Date(values.eventDate.endDate!)
      endDate.setDate(endDate.getDate() + 1)
      start = values.eventDate.startDate!.toLocaleString('sv-SE').split(' ')[0]
      end = endDate.toLocaleString('sv-SE').split(' ')[0]
    }

    try {
      if (eventId === 0) {
        // 新規イベントの追加の場合
        response = await AdminEventFetch.addEvent({
          title: values.title,
          allDay: !values.isTimeSettingEnabled, // 終日イベントかどうか
          start: start!,
          end: end!,
          category: values.category,
          description: values.description ?? '',
          url: values.url ?? ''
        })
      } else {
        // イベントの更新の場合
        response = await AdminEventFetch.updateEvent(eventId, {
          title: values.title,
          allDay: !values.isTimeSettingEnabled, // 終日イベントかどうか
          start: start!,
          end: end!,
          category: values.category,
          description: values.description ?? '',
          url: values.url ?? ''
        })
      }
      if (response.ok) {
        if (eventId === 0) {
          setSuccess('イベントを追加しました')
        } else {
          setSuccess('イベントを更新しました')
        }

        // 登録完了
        setCompleted(true)

        // イベントの更新をカレンダーに通知
        notifyEventUpdate()
      } else if (response.status === 422) {
        // バリデーションエラー
        const resBody = await response.json()
        if (resBody && resBody.message) {
          setError(resBody.message)
        } else {
          setError('入力データが無効です。再度確認してください。')
        }
      } else if (response.status === 401) {
        setError('アクセス権がありません。再度ログインしてください。')
      } else {
        const resBody = await response.json()
        if (resBody && resBody.message) {
          setError(resBody.message)
        } else {
          setError('サーバでエラーが発生しました')
        }
      }
    } catch (e) {
      setError('通信エラーが発生しました')
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

  // 時間設定(オプション)のチェックボックス変更時の処理
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('isTimeSettingEnabled', event.target.checked)
  }

  // 時間をhh:mm形式に変換
  const _convertTimeToHHMM = (time: string): string => {
    const parts = time.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`
    } else {
      return time
    }
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
            {eventId ? 'イベントを編集' : 'イベントを作成'}
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
                    イベント名
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
                    日時
                  </label>
                  <Controller
                    name="eventDate"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <DateRangePicker
                        ref={rangeRef}
                        startDate={value.startDate}
                        endDate={value.endDate}
                        onChange={(start, end) => onChange({ startDate: start, endDate: end })}
                        isRangeMode={true}
                        showWeekday={true}
                        placeholder="日付を選択"
                      />
                    )}
                  />
                  {errors.eventDate?.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.eventDate.startDate.message}</span>
                    </p>
                  )}
                </div>
                <div className="col-span-4">
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      {...register('isTimeSettingEnabled')}
                      className="peer sr-only"
                      onChange={handleCheckboxChange}
                    />
                    <div className="peer peer-checked:bg-primary-600 peer-focus:ring-primary-300 relative h-6 w-11 rounded-full bg-gray-200 peer-focus:ring-2 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                    <span className="ms-3 font-medium text-gray-900">時間設定(オプション)</span>
                  </label>
                </div>
                {isTimeSettingEnabled && (
                  <>
                    <div className="col-span-2">
                      <label htmlFor="start-time" className="mb-1 block font-medium text-gray-900">
                        開始日の開始時間
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 end-0 top-0 flex items-center pe-3.5">
                          <svg
                            className="h-4 w-4 text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <input
                          type="time"
                          id="start-time"
                          className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 leading-none text-gray-900"
                          {...register('eventTimeStart')}
                          required
                        />
                      </div>
                      {errors.eventTimeStart && (
                        <p className="mt-1 text-sm text-red-600">
                          <span className="font-medium">{errors.eventTimeStart.message}</span>
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="end-time" className="mb-1 block font-medium text-gray-900">
                        終了日の終了時間
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 end-0 top-0 flex items-center pe-3.5">
                          <svg
                            className="h-4 w-4 text-gray-500"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <input
                          type="time"
                          id="end-time"
                          className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 leading-none text-gray-900"
                          {...register('eventTimeEnd')}
                        />
                      </div>
                      {errors.eventTimeEnd && (
                        <p className="mt-1 text-sm text-red-600">
                          <span className="font-medium">{errors.eventTimeEnd.message}</span>
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div className="col-span-4">
                  <label htmlFor="color-dropdown" className="mb-1 block font-medium text-gray-900">
                    カテゴリー
                  </label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <ColorDropdown
                        id="color-dropdown"
                        selectedIndex={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.category.message}</span>
                    </p>
                  )}
                </div>
                <div className="col-span-4">
                  <label htmlFor="description" className="mb-1 block font-medium text-gray-900">
                    イベント内容
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
                            <div>開催内容</div>
                            <div>---</div>
                            <div>
                              このイベントでは、最新の技術動向について解説し、実践的なワークショップを行います。
                            </div>
                          </div>
                          <div className="mt-4">
                            <div>スケジュール</div>
                            <div>---</div>
                            <div>- 13:00 開場・受付開始</div>
                            <div>- 13:30 オープニングトーク</div>
                            <div>- 14:00 メインセッション</div>
                          </div>
                        </div>
                        <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900"></div>
                      </div>
                    </span>
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={6}
                    className={`block w-full rounded-lg border ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                  ></textarea>
                </div>
                <div className="col-span-4">
                  <label htmlFor="url" className="mb-1 block font-medium text-gray-900">
                    詳細ページURL(オプション)
                  </label>
                  <input
                    id="url"
                    {...register('url')}
                    placeholder="https://example.com"
                    className={`block w-full rounded-lg border ${
                      errors.url ? 'border-red-500' : 'border-gray-300'
                    } focus:border-primary-500 focus:ring-primary-500 bg-gray-50 p-2.5 text-gray-900`}
                  />
                  {errors.url && (
                    <p className="mt-1 text-sm text-red-600">
                      <span className="font-medium">{errors.url.message}</span>
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* モーダルフッタ部 */}
            <div className="flex justify-end space-x-3 pt-4">
              {!completed && (
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {eventId ? '更新する' : '追加する'}
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

export default EventModal
