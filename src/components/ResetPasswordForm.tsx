import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import Spinner from '@/components/base/Spinner'
import AuthFetch from '@/fetch/auth'
import { type FormEventHandler, useEffect, useState } from 'react'

interface ResetPasswordFormProps {
  token: string
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // トークンの検証
  useEffect(() => {
    void (async () => {
      try {
        const result = await AuthFetch.verifyResetToken(token)
        if (result.success && result.data?.valid) {
          setIsValidToken(true)
        } else {
          setError('リセットリンクが無効または期限切れです')
        }
      } catch {
        setError('トークンの検証に失敗しました')
      } finally {
        setIsValidating(false)
      }
    })()
  }, [token])

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError('')

    // パスワード確認
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    // パスワード強度チェック
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await AuthFetch.resetPassword(token, newPassword)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.message || 'パスワードリセットに失敗しました')
      }
    } catch {
      setError('パスワードリセットに失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ローディング中
  if (isValidating) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">トークンを確認しています...</p>
        </div>
      </div>
    )
  }

  // トークンが無効
  if (!isValidToken) {
    return (
      <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">リンクが無効です</h2>
        <Alert
          message="このリセットリンクは無効または期限切れです。もう一度パスワードリセットをお申し込みください。"
          type="error"
        />
        <div className="flex gap-4">
          <a
            href="/forgot-password"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            パスワードリセット申請
          </a>
          <a href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            ログイン画面
          </a>
        </div>
      </div>
    )
  }

  // パスワードリセット成功
  if (success) {
    return (
      <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">パスワードを変更しました</h2>
        <Alert
          message="パスワードを変更しました。新しいパスワードでログインしてください。"
          type="success"
        />
        <div>
          <a href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
            ログイン画面へ
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">新しいパスワードの設定</h2>
        <p className="mt-2 text-base text-gray-600">
          新しいパスワードを入力してください。パスワードは8文字以上で設定してください。
        </p>
      </div>

      {error && <Alert message={error} type="error" />}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword" className="mb-1 block font-medium text-gray-900">
            新しいパスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-base text-gray-900"
              required
              disabled={isSubmitting}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block font-medium text-gray-900">
            パスワード（確認）
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-base text-gray-900"
              required
              disabled={isSubmitting}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'パスワードを非表示' : 'パスワードを表示'}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <a
            href="/login"
            className="text-primary-600 hover:text-primary-500 text-base font-medium"
          >
            ログイン画面に戻る
          </a>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '変更中...' : 'パスワードを変更'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ResetPasswordForm
