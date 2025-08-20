import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import { AdminUserFetch } from '@/fetch/admin'
import { type IUser, type UserRole } from '@/types/user'
import { generate } from 'generate-password-ts'
import type { FC } from 'react'
import { useState } from 'react'

interface UserAddModalProps {
  open: boolean
  onClose: () => void
  onUserAdded: (user: IUser) => void
}

const UserAddModal: FC<UserAddModalProps> = ({ open, onClose, onUserAdded }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER' as UserRole
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!open) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    if (!form.name.trim()) return '氏名は必須です'
    if (!form.email.trim()) return 'メールアドレスは必須です'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'メールアドレスの形式が不正です'
    if (!form.password || form.password.length < 8) return 'パスワードは8文字以上で入力してください'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    // 入力値をtrim
    const trimmedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim()
    }
    setForm(trimmedForm)

    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setIsSubmitting(true)
    try {
      const result = await AdminUserFetch.addUser({
        name: trimmedForm.name,
        email: trimmedForm.email,
        password: trimmedForm.password,
        role: trimmedForm.role,
        isEnabled: true
      })

      if (result.success && result.data) {
        setSuccess('ユーザを追加しました')
        setCompleted(true)
        onUserAdded(result.data)
      } else {
        setError(result.message || 'ユーザの追加に失敗しました')
      }
    } catch (err: any) {
      setError('通信エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // パスワード生成関数
  function generatePassword(): string {
    return generate({
      length: 10,
      numbers: true
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black/50">
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
        {/* ヘッダー */}
        <div className="relative px-6 pt-6">
          <div className="absolute top-6 right-6">
            <button
              type="button"
              onClick={onClose}
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
          <h2 className="mb-3 text-3xl font-bold text-gray-900">ユーザ追加</h2>
        </div>
        {/* コンテンツ */}
        <div className="px-6 pt-0 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && <Alert message={success} type="success" />}
            {error && <Alert message={error} type="error" />}
            <fieldset disabled={completed || isSubmitting}>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <label htmlFor="name" className="mb-1 block font-medium text-gray-900">
                    名前
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <label htmlFor="email" className="mb-1 block font-medium text-gray-900">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                    required
                  />
                </div>
                <div className="col-span-4">
                  <div className="mb-1 flex items-center">
                    <label htmlFor="password" className="mr-2 block font-medium text-gray-900">
                      パスワード
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
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
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                      aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                <div className="col-span-4">
                  <label htmlFor="role" className="mb-1 block font-medium text-gray-900">
                    権限
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="focus:border-primary-500 focus:ring-primary-500 block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                    required
                  >
                    <option value="MEMBER">一般メンバー</option>
                    <option value="EDITOR">編集者</option>
                    <option value="MODERATOR">モデレータ</option>
                    <option value="ADMIN">管理者</option>
                  </select>
                </div>
              </div>
            </fieldset>
            <div className="flex justify-end space-x-3 pt-4">
              {!completed && (
                <>
                  <Button type="button" variant="default" onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    追加する
                  </Button>
                </>
              )}
              {completed && (
                <Button type="button" variant="default" onClick={onClose}>
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

export default UserAddModal
