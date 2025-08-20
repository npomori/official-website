import Button from '@/components/base/Button'
import AdminUserFetch from '@/fetch/admin/user'
import { type IUser } from '@/types/user'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import UserAddModal from './UserAddModal'
import UserDeleteModal from './UserDeleteModal'
import UserEditModal from './UserEditModal'
import UserList from './UserListMain'

const UserListPanel: FC = () => {
  const [users, setUsers] = useState<IUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await AdminUserFetch.getUsers()
        if (result.success && result.data) {
          setUsers(result.data)
        } else {
          setError(result.message || 'ユーザ情報の取得に失敗しました')
        }
      } catch (err) {
        setError('ユーザ情報の取得に失敗しました')
        console.error('Users fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="py-10 text-center">ユーザ情報を読み込み中...</div>
  }

  if (error) {
    return <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
  }

  return (
    <>
      <div className="block items-center justify-between border-b border-gray-200 bg-white p-4 sm:flex">
        <div className="mb-1 w-full">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">ユーザ一覧</h1>
          </div>
          <div className="sm:flex">
            <div className="mb-3 hidden items-center sm:mb-0 sm:flex sm:divide-x sm:divide-gray-100">
              <form className="lg:pr-3" action="#" method="GET">
                <label htmlFor="users-search" className="sr-only">
                  検索
                </label>
                <div className="relative mt-1 lg:w-64 xl:w-96">
                  <input
                    type="text"
                    name="search"
                    id="users-search"
                    placeholder="ユーザを検索"
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </form>
            </div>
            <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
              <Button
                type="button"
                onClick={() => setShowAddModal(true)}
                variant="primary"
                class="w-1/2 sm:w-auto"
                icon="mdi:plus-thick"
              >
                ユーザを追加
              </Button>
            </div>
          </div>
        </div>
      </div>

      <UserList
        users={filteredUsers}
        onEdit={(user) => {
          setSelectedUser(user)
          setShowEditModal(true)
        }}
        onDelete={(user) => {
          setSelectedUser(user)
          setShowDeleteModal(true)
        }}
      />

      {showAddModal && (
        <UserAddModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onUserAdded={async () => {
            try {
              const result = await AdminUserFetch.getUsers()
              if (result.success && result.data) {
                setUsers(result.data)
                //setShowAddModal(false)
              } else {
                setError(result.message || 'ユーザ一覧の更新に失敗しました')
              }
            } catch (err) {
              setError('ユーザ一覧の更新に失敗しました')
              console.error('Users fetch error:', err)
            }
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <UserEditModal
          open={showEditModal}
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onUserUpdated={(updatedUser) => {
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
            //setShowEditModal(false)
            //setSelectedUser(null)
          }}
        />
      )}

      {showDeleteModal && selectedUser && (
        <UserDeleteModal
          open={showDeleteModal}
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedUser(null)
          }}
          onUserDeleted={(deletedUserId) => {
            setUsers(users.filter((u) => u.id !== deletedUserId))
            //setShowDeleteModal(false)
            //setSelectedUser(null)
          }}
        />
      )}
    </>
  )
}

export default UserListPanel
