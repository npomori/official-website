import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import AuthFetch from '@/fetch/auth'
import { type FormEventHandler, useState } from 'react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const login: FormEventHandler<HTMLFormElement> = async (event) => {
    // イベントキャンセル
    event.preventDefault()

    // ログイン処理
    try {
      const result = await AuthFetch.login(email, password, rememberMe)
      if (result.success) {
        // ログイン成功の場合
        window.location.href = '/'
      } else {
        //setError(result.message || 'ログインに失敗しました')
        setError('ログインに失敗しました')
      }
    } catch (error) {
      setError('ログインに失敗しました')
    }
  }

  return (
    <div className="w-full space-y-8 rounded-lg bg-white p-6 shadow ring-1 ring-black/5 sm:p-8">
      <h2 className="text-2xl font-bold text-gray-900">ログイン</h2>
      {error && <Alert message={error} type="error" />}
      <form className="mt-8 space-y-6" onSubmit={login}>
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
            className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block font-medium text-gray-900">
            パスワード
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
              required
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
          <label htmlFor="rememberMe" className="inline-flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-gray-300"
            />
            <span className="ml-2 text-gray-900">ログイン状態を保持する</span>
          </label>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" type="submit" text="ログイン" />
        </div>
      </form>
    </div>
  )
}

export default Login
