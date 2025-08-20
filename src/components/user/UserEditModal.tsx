import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import config from '@/config/config.json'
import { AdminUserFetch } from '@/fetch/admin'
import { type IUser, type UserRole } from '@/types/user'
import { generate } from 'generate-password-ts'
import type { FC } from 'react'
import { useState } from 'react'

type UserEditModalProps = {
  open: boolean
  user: IUser
  onClose: () => void
  onUserUpdated: (user: IUser) => void
}

const UserEditModal: FC<UserEditModalProps> = ({ open, user, onClose, onUserUpdated }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'MEMBER' as UserRole,
    isEnabled: true,
    password: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 初期値の設定
  useState(() => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isEnabled: user.isEnabled ?? true,
      password: ''
    })
  })

  // パスワード生成関数
  function generatePassword(): string {
    return generate({
      length: 10,
      numbers: true
    })
  }

  if (!open) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value =
      e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const validate = () => {
    if (!form.name.trim()) return '氏名は必須です'
    if (!form.email.trim()) return 'メールアドレスは必須です'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'メールアドレスの形式が不正です'
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
      email: form.email.trim(),
      password: form.password.trim()
    }
    setForm(trimmedForm)

    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await AdminUserFetch.updateUser(user.id, {
        name: trimmedForm.name,
        email: trimmedForm.email,
        role: trimmedForm.role,
        isEnabled: trimmedForm.isEnabled,
        password: trimmedForm.password || null
      })

      if (result.success && result.data) {
        setSuccess('ユーザを更新しました')
        setCompleted(true)
        onUserUpdated(result.data)
      } else {
        setError(result.message || 'ユーザの更新に失敗しました')
      }
    } catch (err: any) {
      setError('通信エラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
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
          <h2 className="mb-3 text-3xl font-bold text-gray-900">ユーザ編集</h2>
        </div>
        {/* コンテンツ */}
        <div className="px-6 pt-0 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && <Alert message={success} type="success" />}
            {error && <Alert message={error} type="error" />}

            <fieldset disabled={completed || isSubmitting}>
              <div className="grid grid-cols-4 gap-4">
                {/* 表示のみの情報 */}
                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-500">アバター</label>
                  <div className="flex items-center space-x-4">
                    <img
                      className="h-16 w-16 rounded-full border border-gray-300 object-cover"
                      src={
                        user.avatar
                          ? `${config.upload.avatar.url}/${user.avatar}`
                          : `${config.upload.avatar.url}/${config.upload.avatar.default}`
                      }
                      alt={`${user.name} avatar`}
                    />
                  </div>
                </div>

                {user.biography && (
                  <div className="col-span-4">
                    <label className="mb-1 block font-medium text-gray-500">自己紹介</label>
                    <div className="text-gray-900">{user.biography}</div>
                  </div>
                )}

                {/* 編集可能な情報 */}
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
                      className="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pr-12 text-gray-900"
                      placeholder="変更する場合のみ入力してください"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
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
                  <p className="mt-1 text-sm text-gray-500">
                    入力がない場合は現在のパスワードが維持されます
                  </p>
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

                <div className="col-span-4 pt-2">
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      name="isEnabled"
                      checked={form.isEnabled}
                      onChange={handleChange}
                      className="peer sr-only"
                    />
                    <div className="peer peer-checked:bg-primary-600 peer-focus:ring-primary-300 relative h-6 w-11 rounded-full bg-gray-200 peer-focus:ring-2 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                    <span className="ms-3 font-medium text-gray-900">アカウントを有効にする</span>
                  </label>
                </div>

                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-500">登録日</label>
                  <div className="text-gray-900">
                    {user.createdAt instanceof Date
                      ? user.createdAt.toLocaleDateString('ja-JP')
                      : new Date(user.createdAt).toLocaleDateString('ja-JP')}
                  </div>
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
                    更新する
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

export default UserEditModal
