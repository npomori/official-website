import DateRangePicker from '@/components/DateRangePicker'
import type { ApiResponse, ValidationErrorResponse } from '@/types/api'
import { useRef, useState, type FormEvent } from 'react'

interface JoinFormData {
  memberType: 'regular' | 'support' | ''
  name: string
  furigana: string
  email: string
  tel: string
  address: string
  birthDate: Date | null
  occupation: string
  experience: string
  motivation: string
  privacy: boolean
}

const initialFormData: JoinFormData = {
  memberType: '',
  name: '',
  furigana: '',
  email: '',
  tel: '',
  address: '',
  birthDate: null,
  occupation: '',
  experience: '',
  motivation: '',
  privacy: false
}

export default function JoinForm() {
  const [formData, setFormData] = useState<JoinFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    // フィールドのエラーをクリア
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target
    setFormData((prev) => ({ ...prev, [id]: checked }))
    // フィールドのエラーをクリア
    if (fieldErrors[id]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }

  const handleBirthDateChange = (startDate: Date | null) => {
    setFormData((prev) => ({ ...prev, birthDate: startDate }))
    // フィールドのエラーをクリア
    if (fieldErrors.birthDate) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.birthDate
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })
    setFieldErrors({})

    try {
      // APIリクエスト用のデータを準備
      const requestData = {
        memberType: formData.memberType,
        name: formData.name,
        furigana: formData.furigana,
        email: formData.email,
        tel: formData.tel,
        address: formData.address,
        birthDate: formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : '',
        occupation: formData.occupation,
        experience: formData.experience,
        motivation: formData.motivation,
        privacy: formData.privacy
      }

      // API呼び出し
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const result: ApiResponse<{ message: string }> | ValidationErrorResponse =
        await response.json()

      if (response.ok && 'success' in result && result.success) {
        // 成功
        setSubmitStatus({
          type: 'success',
          message:
            result.message || '入会申し込みを受け付けました。後日、必要書類を郵送いたします。'
        })
        setIsSubmitted(true)
      } else if (response.status === 422 && 'errors' in result) {
        // バリデーションエラー
        setFieldErrors(result.errors)
        setSubmitStatus({
          type: 'error',
          message: result.message || '入力内容に誤りがあります。'
        })
      } else {
        // その他のエラー
        setSubmitStatus({
          type: 'error',
          message:
            'message' in result
              ? result.message
              : '入会申し込みの送信に失敗しました。もう一度お試しください。'
        })
      }
    } catch (error) {
      console.error('入会申し込みエラー:', error)
      setSubmitStatus({
        type: 'error',
        message: 'ネットワークエラーが発生しました。もう一度お試しください。'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      {submitStatus.type && (
        <div
          className={`mb-4 rounded-md p-4 ${
            submitStatus.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="memberType" className="mb-1 block text-base font-medium text-gray-700">
            会員種別
          </label>
          <select
            id="memberType"
            value={formData.memberType}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.memberType ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          >
            <option value="">選択してください</option>
            <option value="regular">正会員</option>
            <option value="support">賛助会員</option>
          </select>
          {fieldErrors.memberType && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.memberType}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-base font-medium text-gray-700">
            お名前
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="furigana" className="mb-1 block text-base font-medium text-gray-700">
            フリガナ
          </label>
          <input
            type="text"
            id="furigana"
            value={formData.furigana}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.furigana ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.furigana && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.furigana}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-base font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="tel" className="mb-1 block text-base font-medium text-gray-700">
            電話番号
          </label>
          <input
            type="tel"
            id="tel"
            value={formData.tel}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.tel ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.tel && <p className="mt-1 text-sm text-red-600">{fieldErrors.tel}</p>}
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-base font-medium text-gray-700">
            住所
          </label>
          <textarea
            id="address"
            rows={3}
            value={formData.address}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.address ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.address && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-base font-medium text-gray-700">生年月日</label>
          <DateRangePicker
            ref={datePickerRef}
            startDate={formData.birthDate}
            endDate={formData.birthDate}
            onChange={handleBirthDateChange}
            isRangeMode={false}
            placeholder="生年月日を選択"
            showWeekday={false}
          />
          {fieldErrors.birthDate && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.birthDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="occupation" className="mb-1 block text-base font-medium text-gray-700">
            職業
          </label>
          <input
            type="text"
            id="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.occupation ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitted}
          />
          {fieldErrors.occupation && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.occupation}</p>
          )}
        </div>

        <div>
          <label htmlFor="experience" className="mb-1 block text-base font-medium text-gray-700">
            森林ボランティア経験
          </label>
          <textarea
            id="experience"
            rows={3}
            value={formData.experience}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.experience ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isSubmitted}
          />
          {fieldErrors.experience && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.experience}</p>
          )}
        </div>

        <div>
          <label htmlFor="motivation" className="mb-1 block text-base font-medium text-gray-700">
            入会の動機
          </label>
          <textarea
            id="motivation"
            rows={3}
            value={formData.motivation}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.motivation ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={isSubmitted}
          />
          {fieldErrors.motivation && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.motivation}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="privacy"
            checked={formData.privacy}
            onChange={handleCheckboxChange}
            className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
            required
            disabled={isSubmitted}
          />
          <label htmlFor="privacy" className="ml-2 block text-base text-gray-700">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-800"
            >
              プライバシーポリシー
            </a>
            に同意する
          </label>
        </div>
        {fieldErrors.privacy && <p className="mt-1 text-sm text-red-600">{fieldErrors.privacy}</p>}

        <button
          type="submit"
          disabled={isSubmitting || isSubmitted}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '送信中...' : isSubmitted ? '送信済み' : '申し込む'}
        </button>
      </form>
    </div>
  )
}
