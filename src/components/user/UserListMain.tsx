import Button from '@/components/base/Button'
import config from '@/config/config.json'
import { type IUser } from '@/types/user'
import type { FC } from 'react'
import { useState } from 'react'

type UserListProps = {
  users: IUser[]
  onEdit: (user: IUser) => void
  onDelete: (user: IUser) => void
}

const UserList: FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(users.length / itemsPerPage)

  // ロールの日本語ラベル変換
  const roleLabel: Record<string, string> = {
    ADMIN: '管理者',
    MODERATOR: 'モデレータ',
    EDITOR: '編集者',
    MEMBER: '一般メンバー'
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow">
            <table className="min-w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="p-4 text-left font-medium text-gray-500">
                    名前
                  </th>
                  <th scope="col" className="p-4 text-left font-medium text-gray-500">
                    権限
                  </th>
                  <th scope="col" className="p-4 text-left font-medium text-gray-500">
                    登録日
                  </th>
                  <th scope="col" className="p-4 text-left font-medium text-gray-500">
                    状態
                  </th>
                  <th scope="col" className="p-4 text-left font-medium text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100">
                    <td className="mr-12 flex items-center space-x-6 p-4 whitespace-nowrap">
                      <img
                        className="h-10 w-10 rounded-full border border-gray-300 object-cover"
                        src={
                          user.avatar
                            ? `${config.upload.avatar.url}/${user.avatar}`
                            : `${config.upload.avatar.url}/${config.upload.avatar.default}`
                        }
                        alt={`${user.name} avatar`}
                      />
                      <div className="font-normal text-gray-500">
                        <div className="text-base font-semibold text-gray-900">{user.name}</div>
                        <div className="font-normal text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-base font-medium whitespace-nowrap text-gray-900">
                      {roleLabel[user.role] ?? '-'}
                    </td>
                    <td className="p-4 text-base font-normal whitespace-nowrap text-gray-900">
                      {user.createdAt instanceof Date
                        ? user.createdAt.toLocaleDateString('ja-JP')
                        : new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="p-4 text-base font-normal whitespace-nowrap text-gray-900">
                      <div className="flex items-center">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            user.isEnabled ? 'bg-green-400' : 'bg-red-500'
                          } mr-2`}
                        />
                        <span>{user.isEnabled ? '有効' : '無効'}</span>
                      </div>
                    </td>
                    <td className="space-x-2 p-4 whitespace-nowrap">
                      <Button
                        type="button"
                        onClick={() => onEdit(user)}
                        variant="info"
                        size="md"
                        icon="mdi:square-edit-outline"
                      >
                        編集
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onDelete(user)}
                        variant="error"
                        size="md"
                        icon="mdi:trash-can-outline"
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      ユーザがいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* フッタ（ページネーション）を常に表示 */}
      <div className="sticky right-0 bottom-0 w-full items-center border-t border-b border-gray-300 bg-white p-4 sm:flex sm:justify-between">
        <div className="mb-4 flex items-center sm:mb-0">
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || totalPages === 1 || users.length === 0}
              className="inline-flex cursor-pointer justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-7 w-7"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 1 || users.length === 0}
              className="inline-flex cursor-pointer justify-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="h-7 w-7"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <span className="ml-4 font-normal text-gray-500">
            {users.length === 0 ? (
              <span className="font-semibold text-gray-900">全0件</span>
            ) : totalPages === 1 ? (
              <span className="font-semibold text-gray-900">全{users.length}件</span>
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}-{Math.min(endIndex, users.length)}
                </span>{' '}
                / 全 <span className="font-semibold text-gray-900">{users.length}</span>件
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UserList
