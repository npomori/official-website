import config from '@/config/config.json'
import contactSubjects from '@/config/contact-subject.json'
import emailFetch from '@/fetch/email'
import { useState, type FormEvent } from 'react'

interface ContactFormData {
  name: string
  email: string
  memberType: 'member' | 'non-member' | ''
  subject: string
  message: string
  privacy: boolean
}

const initialFormData: ContactFormData = {
  name: '',
  email: '',
  memberType: '',
  subject: '',
  message: '',
  privacy: false
}

// 設定から文字数制限を取得
const NAME_MAX_LENGTH = config.contact.nameMaxLength
const EMAIL_MAX_LENGTH = config.contact.emailMaxLength
const MESSAGE_MAX_LENGTH = config.contact.messageMaxLength

interface ContactFormProps {
  disabled?: boolean
}

export default function ContactForm({ disabled = false }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

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

    // フォームが無効化されている場合は送信しない
    if (disabled) {
      setSubmitStatus({
        type: 'error',
        message: 'お問い合わせ機能は現在利用できません'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })
    setFieldErrors({})

    // 送信前に全ての文字列フィールドをトリミング
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      memberType: formData.memberType as 'member' | 'non-member',
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      privacy: formData.privacy
    }

    try {
      const result = await emailFetch.sendContact(trimmedData)

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: result.data?.message || 'お問い合わせを送信しました'
        })
        setIsSubmitted(true)
      } else {
        // エラーの場合
        if (result.errors) {
          // バリデーションエラー
          setFieldErrors(result.errors)
          setSubmitStatus({
            type: 'error',
            message: result.message || '入力内容に誤りがあります'
          })
        } else {
          setSubmitStatus({
            type: 'error',
            message: result.message || 'お問い合わせの送信に失敗しました。'
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
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={disabled || isSubmitted}
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
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={disabled || isSubmitted}
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="mb-2 block text-base font-medium text-gray-700">会員種別</label>
          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="radio"
                id="memberType"
                name="memberType"
                value="member"
                checked={formData.memberType === 'member'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                required
                disabled={disabled || isSubmitted}
              />
              <span className="ml-2 text-base text-gray-700">会員</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                id="memberType"
                name="memberType"
                value="non-member"
                checked={formData.memberType === 'non-member'}
                onChange={handleChange}
                className="text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                required
                disabled={disabled || isSubmitted}
              />
              <span className="ml-2 text-base text-gray-700">非会員</span>
            </label>
          </div>
          {fieldErrors.memberType && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.memberType}</p>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="mb-1 block text-base font-medium text-gray-700">
            件名
          </label>
          <select
            id="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.subject ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={disabled || isSubmitted}
          >
            <option value="">選択してください</option>
            {contactSubjects.map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
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
            className={`focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-gray-50 px-3 py-2 focus:outline-none ${
              fieldErrors.message ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={disabled || isSubmitted}
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
            disabled={disabled || isSubmitted}
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
          disabled={isSubmitting || disabled || isSubmitted}
          className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 w-full rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled
            ? '送信できません'
            : isSubmitting
              ? '送信中...'
              : isSubmitted
                ? '送信済み'
                : '送信する'}
        </button>
      </form>
    </div>
  )
}
