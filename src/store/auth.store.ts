'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JwtAdminPayload } from '@arogenpm/sdk'

interface AuthState {
  admin: (JwtAdminPayload & { name: string }) | null
  token: string | null
  setAuth: (token: string, admin: JwtAdminPayload & { name: string }) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      setAuth: (token, admin) => set({ token, admin }),
      clearAuth: () => set({ token: null, admin: null }),
      isAuthenticated: () => !!get().token,
    }),
    { name: 'aroge-admin-auth' }
  )
)
