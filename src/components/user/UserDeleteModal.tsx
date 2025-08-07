import Alert from '@/components/base/Alert'
import Button from '@/components/base/Button'
import config from '@/config/config.json'
import { AdminUserFetch } from '@/fetch/admin'
import { type IUser } from '@/types/user'
import type { FC } from 'react'
import { useState } from 'react'

type UserDeleteModalProps = {
  open: boolean
  user: IUser
  onClose: () => void
  onUserDeleted: (userId: number) => void
}

const UserDeleteModal: FC<UserDeleteModalProps> = ({ open, user, onClose, onUserDeleted }) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    setIsSubmitting(true)
    try {
      const response = await AdminUserFetch.deleteUser(user.id)

      if (response.ok) {
        setSuccess('ユーザを削除しました')
        setCompleted(true)
        onUserDeleted(user.id)
      } else {
        const resBody = await response.json()
        if (resBody && resBody.message) {
          setError(resBody.message)
        } else {
          setError('サーバでエラーが発生しました')
        }
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
          <h2 className="mb-3 text-3xl font-bold text-gray-900">ユーザ削除</h2>
        </div>
        {/* コンテンツ */}
        <div className="px-6 pt-0 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && <Alert message={success} type="success" />}
            {error && <Alert message={error} type="error" />}

            <fieldset disabled={completed || isSubmitting}>
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <div className="rounded-lg bg-red-50 p-4 text-red-700">
                    <p className="font-medium">このユーザを削除しますか？</p>
                    <p className="mt-1 text-sm">この操作は取り消すことができません。</p>
                  </div>
                </div>

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

                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-500">名前</label>
                  <div className="text-gray-900">{user.name}</div>
                </div>

                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-500">メールアドレス</label>
                  <div className="text-gray-900">{user.email}</div>
                </div>

                <div className="col-span-4">
                  <label className="mb-1 block font-medium text-gray-500">権限</label>
                  <div className="text-gray-900">
                    {user.role === 'ADMIN' && '管理者'}
                    {user.role === 'MODERATOR' && 'モデレータ'}
                    {user.role === 'EDITOR' && '編集者'}
                    {user.role === 'MEMBER' && '一般メンバー'}
                  </div>
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
                  <Button type="submit" variant="error" disabled={isSubmitting}>
                    削除する
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

export default UserDeleteModal
