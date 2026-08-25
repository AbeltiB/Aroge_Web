import type { JwtAdminPayload } from 'aroge-sdk'

const TOKEN_KEY = 'aroge_admin_token'
const USER_KEY = 'aroge_admin_user'

export const authStorage = {
  getToken: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
  getAdmin: (): JwtAdminPayload | null => {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  },
  setAdmin: (u: JwtAdminPayload) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
}
