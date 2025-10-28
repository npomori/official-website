import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import AuthFetch from '@/fetch/auth'
import { type FormEventHandler, useState } from 'react'

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await AuthFetch.forgotPassword(email)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.message || 'パスワードリセット申請に失敗しました')
      }
    } catch {
      setError('パスワードリセット申請に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">メールを送信しました</h2>
        <Alert
          message="パスワードリセット用のメールを送信しました。\nメールをご確認ください。"
          type="success"
        />
        <div className="space-y-4">
          <p className="text-base text-gray-600">メールが届かない場合は、以下をご確認ください：</p>
          <ul className="list-inside list-disc space-y-1 text-base text-gray-600">
            <li>入力したメールアドレスが正しいか</li>
            <li>迷惑メールフォルダに入っていないか</li>
            <li>メールの受信設定を確認</li>
          </ul>
          <div className="pt-4">
            <a
              href="/login"
              className="text-primary-600 hover:text-primary-500 text-base font-medium"
            >
              ログイン画面に戻る
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">パスワードを忘れた場合</h2>
        <p className="mt-2 text-base text-gray-600">
          登録済みのメールアドレスを入力してください。
          <br />
          パスワードリセット用のリンクをお送りします。
        </p>
      </div>

      {error && <Alert message={error} type="error" />}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="mb-1 block font-medium text-gray-900">
            Eメール
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-base text-gray-900"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <a
            href="/login"
            className="text-primary-600 hover:text-primary-500 text-base font-medium"
          >
            ログイン画面に戻る
          </a>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ForgotPasswordForm
