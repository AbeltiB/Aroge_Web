'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'
import type { JwtAdminPayload, TelegramAuthInput } from '@arogenpm/sdk'

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'aroge_ecommerce_bot'

declare global {
  interface Window {
    onTelegramAdminAuth?: (user: TelegramAuthInput) => void
  }
}

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const widgetRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.onTelegramAdminAuth = async (telegramUser) => {
      setError('')
      setLoading(true)
      try {
        const res = await api.post<{ accessToken: string; admin: JwtAdminPayload & { name: string } }>(
          '/auth/telegram/admin',
          telegramUser
        )
        if (!res.success) {
          setError(res.message)
          return
        }
        setAuth(res.data.accessToken, res.data.admin)
        router.push('/dashboard')
      } catch {
        setError('Network error. Try again.')
      } finally {
        setLoading(false)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAdminAuth(user)')
    script.setAttribute('data-request-access', 'write')
    widgetRef.current?.appendChild(script)

    return () => {
      window.onTelegramAdminAuth = undefined
    }
  }, [router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3efe7' }}>
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#1f7a5a' }}>Aroge</h1>
          <p className="text-sm mt-1" style={{ color: '#444444' }}>Backoffice Admin</p>
        </div>

        <p className="text-sm text-center mb-6" style={{ color: '#444444' }}>
          Sign in with the Telegram account your admin access was set up with.
        </p>

        {loading ? (
          <p className="text-sm text-center" style={{ color: '#1f7a5a' }}>Signing in…</p>
        ) : (
          <div ref={widgetRef} className="flex justify-center" />
        )}

        {error && (
          <p className="text-sm text-red-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
