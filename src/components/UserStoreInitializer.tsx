import { userStore } from '@/store/user'
import type { UserAuth } from '@/types/user'
import { useEffect } from 'react'

interface UserStoreInitializerProps {
  userAuth: UserAuth | null
}

const UserStoreInitializer: React.FC<UserStoreInitializerProps> = ({ userAuth }) => {
  useEffect(() => {
    // ユーザ認証情報をストアに設定
    //userStore.set(userAuth)
    userStore.set(userAuth ?? null)
  }, [userAuth])

  return null // UIをレンダリングしない
}

export default UserStoreInitializer
