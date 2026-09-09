'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'
import type { JwtAdminPayload } from '@arogenpm/sdk'

type StartResponse = { token: string; botId: string; expiresIn: number }
type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; admin: JwtAdminPayload & { name: string } }

// oauth.telegram.org's own full-page auth screen — QR code, "Open Telegram
// Desktop" handoff, and phone number all as real options in one place. The
// embeddable Login Widget loads this same URL with &embed=1, which drops
// the QR/desktop options and defaults straight to phone entry — that's why
// this app links here directly instead of using the widget script.
function buildTelegramAuthUrl(botId: string, returnTo: string): string {
  const origin = window.location.origin
  const params = new URLSearchParams({
    bot_id: botId,
    origin,
    request_access: 'write',
    return_to: returnTo,
  })
  return `https://oauth.telegram.org/auth?${params.toString()}`
}

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'starting' | 'waiting' | 'signing-in'>('idle')
  const [authUrl, setAuthUrl] = useState('')

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  async function startLogin() {
    setError('')
    setStatus('starting')

    const res = await api.post<StartResponse>('/auth/telegram/bot/start', { intent: 'admin' })
    if (!res.success) {
      setError(res.message)
      setStatus('idle')
      return
    }

    const { token, botId } = res.data
    const returnTo = `${window.location.origin}/login/callback?token=${token}`
    const url = buildTelegramAuthUrl(botId, returnTo)
    setAuthUrl(url)
    setStatus('waiting')
    window.open(url, '_blank', 'noopener,noreferrer')

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

        {(status === 'idle' || status === 'starting') && (
          <button
            onClick={startLogin}
            disabled={status === 'starting'}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#1f7a5a' }}
          >
            {status === 'starting' ? 'Starting…' : 'Continue with Telegram'}
          </button>
        )}

        {status === 'waiting' && (
          <div className="text-center space-y-3">
            <p className="text-sm" style={{ color: '#1f7a5a' }}>
              Confirm in the Telegram tab that just opened…
            </p>
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
              style={{ color: '#1f7a5a' }}
            >
              Didn&apos;t open? Tap here
            </a>
          </div>
        )}

        {status === 'signing-in' && (
          <p className="text-sm text-center" style={{ color: '#1f7a5a' }}>Signing in…</p>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
