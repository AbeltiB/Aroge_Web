'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'
import type { JwtAdminPayload } from '@arogenpm/sdk'

type StartResponse = { token: string; deepLink: string; expiresIn: number }
type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; admin: JwtAdminPayload & { name: string } }

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'waiting' | 'signing-in'>('idle')
  const [deepLink, setDeepLink] = useState('')
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  async function startLogin() {
    setError('')
    setStatus('waiting')

    const res = await api.post<StartResponse>('/auth/telegram/bot/start', { intent: 'admin' })
    if (!res.success) {
      setError(res.message)
      setStatus('idle')
      return
    }

    const { token, deepLink: link } = res.data
    setDeepLink(link)
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

        {status === 'idle' && (
          <button
            onClick={startLogin}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white"
            style={{ background: '#1f7a5a' }}
          >
            Continue with Telegram
          </button>
        )}

        {status === 'waiting' && (
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
