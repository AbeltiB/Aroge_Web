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

type StartResponse = { token: string; deepLink: string; expiresIn: number }
type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; admin: JwtAdminPayload & { name: string } }

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const widgetRef = useRef<HTMLDivElement>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'bot-waiting' | 'signing-in'>('idle')
  const [deepLink, setDeepLink] = useState('')

  // Primary path: the Telegram Login Widget. Telegram shows its own native
  // "Log in to Aroge" confirmation (with device/IP) whenever it detects an
  // active session — Telegram Desktop running locally, or a logged-in
  // Telegram Web tab. It only falls back to asking for a phone number when
  // neither is present, which no site-side implementation can prevent.
  useEffect(() => {
    window.onTelegramAdminAuth = async (telegramUser) => {
      setError('')
      setStatus('signing-in')
      try {
        const res = await api.post<{ accessToken: string; admin: JwtAdminPayload & { name: string } }>(
          '/auth/telegram/admin',
          telegramUser
        )
        if (!res.success) {
          setError(res.message)
          setStatus('idle')
          return
        }
        setAuth(res.data.accessToken, res.data.admin)
        router.push('/dashboard')
      } catch {
        setError('Network error. Try again.')
        setStatus('idle')
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
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [router, setAuth])

  // Fallback path: bot deep-link + poll, for admins with no active Telegram
  // session anywhere (the widget would otherwise dead-end on a phone-number
  // prompt) — confirms inside the Telegram app itself instead.
  async function startBotLogin() {
    setError('')
    setStatus('loading')

    const res = await api.post<StartResponse>('/auth/telegram/bot/start', { intent: 'admin' })
    if (!res.success) {
      setError(res.message)
      setStatus('idle')
      return
    }

    const { token, deepLink: link } = res.data
    setDeepLink(link)
    setStatus('bot-waiting')
    window.open(link, '_blank', 'noopener,noreferrer')

    const deadline = Date.now() + 5 * 60 * 1000
    pollTimer.current = setInterval(async () => {
      if (Date.now() > deadline) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setError('Login timed out. Please try again.')
        setStatus('idle')
        return
      }

      const poll = await api.get<PollResponse>(`/auth/telegram/bot/poll/${token}`)
      if (!poll.success) {
        if (pollTimer.current) clearInterval(pollTimer.current)
        setError(poll.message)
        setStatus('idle')
        return
      }
      if (poll.data.status === 'pending') return

      if (pollTimer.current) clearInterval(pollTimer.current)
      setStatus('signing-in')
      setAuth(poll.data.accessToken, poll.data.admin)
      router.push('/dashboard')
    }, 2000)
  }

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

        {status === 'signing-in' && (
          <p className="text-sm text-center" style={{ color: '#1f7a5a' }}>Signing in…</p>
        )}

        {status === 'idle' && (
          <div ref={widgetRef} className="flex justify-center" />
        )}

        {status === 'loading' && (
          <p className="text-sm text-center" style={{ color: '#1f7a5a' }}>Starting…</p>
        )}

        {status === 'bot-waiting' && (
          <div className="text-center space-y-3">
            <p className="text-sm" style={{ color: '#1f7a5a' }}>
              Confirm in the Telegram chat that just opened…
            </p>
            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
              style={{ color: '#1f7a5a' }}
            >
              Didn&apos;t open? Tap here
            </a>
          </div>
        )}

        {status === 'idle' && (
          <button
            onClick={startBotLogin}
            className="w-full text-center text-xs underline mt-4"
            style={{ color: '#666666' }}
          >
            Widget not showing up? Continue via the Telegram bot instead
          </button>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
