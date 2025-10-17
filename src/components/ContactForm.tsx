import config from '@/config/config.json'
import type { ApiResponse } from '@/types/api'
import { useState, type FormEvent } from 'react'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  privacy: boolean
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
  privacy: false
}

// 設定から文字数制限を取得
const NAME_MAX_LENGTH = config.contact.nameMaxLength
const EMAIL_MAX_LENGTH = config.contact.emailMaxLength
const MESSAGE_MAX_LENGTH = config.contact.messageMaxLength

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })
    setFieldErrors({})

    // 送信前に全ての文字列フィールドをトリミング
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      privacy: formData.privacy
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trimmedData)
      })

      const data = await res.json()

      if (res.ok) {
        const response = data as ApiResponse<{ message: string }>
        setSubmitStatus({
          type: 'success',
          message: response.message || 'お問い合わせを送信しました。ご連絡ありがとうございます。'
        })
        setFormData(initialFormData)
      } else {
        // バリデーションエラーの場合
        if (res.status === 422 && data.errors) {
          setFieldErrors(data.errors as Record<string, string>)
          setSubmitStatus({
            type: 'error',
            message: data.message || '入力内容に誤りがあります'
          })
        } else {
          setSubmitStatus({
            type: 'error',
            message: data.message || 'お問い合わせの送信に失敗しました。'
          })
        }
      }
    } catch (error) {
      console.error('お問い合わせ送信エラー:', error)
      setSubmitStatus({
        type: 'error',
        message: 'お問い合わせの送信に失敗しました。もう一度お試しください。'
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
          <label htmlFor="name" className="mb-1 block text-base font-medium text-gray-700">
            お名前
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={NAME_MAX_LENGTH}
            className={`focus:border-primary-500 w-full rounded-md border px-3 py-2 focus:outline-none ${
              fieldErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
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
            maxLength={EMAIL_MAX_LENGTH}
            className={`focus:border-primary-500 w-full rounded-md border px-3 py-2 focus:outline-none ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="mb-1 block text-base font-medium text-gray-700">
            件名
          </label>
          <select
            id="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`focus:border-primary-500 w-full rounded-md border px-3 py-2 focus:outline-none ${
              fieldErrors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">選択してください</option>
            <option value="general">一般のお問い合わせ</option>
            <option value="membership">会員について</option>
            <option value="activities">活動について</option>
            <option value="volunteer">ボランティアについて</option>
            <option value="other">その他</option>
          </select>
          {fieldErrors.subject && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.subject}</p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-base font-medium text-gray-700">
            お問い合わせ内容
          </label>
          <textarea
            id="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            maxLength={MESSAGE_MAX_LENGTH}
            className={`focus:border-primary-500 w-full rounded-md border px-3 py-2 focus:outline-none ${
              fieldErrors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {fieldErrors.message && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.message}</p>
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
          />
          <label htmlFor="privacy" className="ml-2 block text-base text-gray-700">
            <a href="/privacy" className="text-primary-600 hover:text-primary-800">
              プライバシーポリシー
            </a>
            に同意する
          </label>
        </div>
        {fieldErrors.privacy && <p className="mt-1 text-sm text-red-600">{fieldErrors.privacy}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? '送信中...' : '送信する'}
        </button>
      </form>
    </div>
  )
}
