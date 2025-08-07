import { atom } from 'nanostores'

interface User {
  id: string
  email: string
  name: string
  role: string
}

class UsersStore {
  static users = atom<User[]>([])

  static async update(users: User[]) {
    UsersStore.users.set(users)
  }
}

export default UsersStore
