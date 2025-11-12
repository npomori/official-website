import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import { generate } from 'generate-password-ts'
import { useState, type FC } from 'react'

interface VerifyFormProps {
  token: string
}

const VerifyForm: FC<VerifyFormProps> = ({ token }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // パスワード生成関数
  function generatePassword(): string {
    return generate({
      length: 10,
      numbers: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const result = await res.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        setError(String(result.message || '認証に失敗しました'))
      }
    } catch {
      setError('通信エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">認証エラー</h2>
        <Alert message="認証トークンが見つかりません" type="error" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">パスワード設定</h2>
        <p className="mt-2 text-base text-gray-600">
          アカウントを有効化するために、パスワードを設定してください。パスワードは8文字以上で設定してください。
        </p>
      </div>

      {success ? (
        <Alert message="認証が完了しました。ログイン画面へ移動します..." type="success" />
      ) : (
        <>
          {error && <Alert message={error} type="error" />}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <div className="mb-1 flex items-center">
                <label htmlFor="password" className="mr-2 block font-medium text-gray-900">
                  パスワード
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const pwd = generatePassword()
                    setPassword(pwd)
                    setConfirmPassword(pwd)
                  }}
                  className="hover:text-primary-600 cursor-pointer text-gray-400 focus:outline-none"
                  title="ランダムパスワード生成"
                  aria-label="ランダムパスワード生成"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12a7.5 7.5 0 0113.5-5.303M19.5 12a7.5 7.5 0 01-13.5 5.303M4.5 12H2.25M19.5 12h2.25"
                    />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-base text-gray-900"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-base text-gray-900"
                  required
                  minLength={8}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              <p className="mt-1 text-sm text-gray-600">8文字以上で入力してください</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? '設定中...' : '設定する'}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default VerifyForm
