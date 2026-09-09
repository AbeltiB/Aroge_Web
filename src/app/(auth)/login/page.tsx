'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth.store'
import { Button } from '../../../components/ui'
import type { JwtAdminPayload } from '@arogenpm/sdk'

type StartResponse = { token: string; deepLink: string; expiresIn: number }
type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; admin: JwtAdminPayload & { name: string } }

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'starting' | 'waiting' | 'signing-in'>('idle')
  const [deepLink, setDeepLink] = useState('')

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [])

  // Opens the bot's own chat (reliably launches the Telegram app itself,
  // even cold) instead of oauth.telegram.org — that page's QR/desktop-app
  // handoff only works when the browser happens to have an active Telegram
  // Web session, which isn't something a site can guarantee. Once in the
  // chat, the bot replies with a Telegram "Login URL" button, which shows
  // the native Log in/Decline confirmation from inside the Telegram client
  // itself instead.
  async function startLogin() {
    setError('')
    setStatus('starting')

    const res = await api.post<StartResponse>('/auth/telegram/bot/start', { intent: 'admin' })
    if (!res.success) {
      setError(res.message)
      setStatus('idle')
      return
    }

    const { token, deepLink: link } = res.data
    setDeepLink(link)
    setStatus('waiting')
    // t.me links are OS-level app launches, not real page loads — navigating
    // the current tab (rather than window.open) triggers Telegram without
    // leaving a blank tab behind; the browser intercepts it before any
    // actual navigation happens.
    window.location.href = link

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
        // The Telegram tab may have already finished this token itself
        // (it completes sign-in on its own instead of waiting for this
        // tab) — rehydrate from localStorage before treating this as
        // a real failure.
        await useAuthStore.persist.rehydrate()
        if (useAuthStore.getState().isAuthenticated()) {
          setStatus('signing-in')
          router.push('/dashboard')
          return
        }
        setError(poll.message)
        setStatus('idle')
        return
      }
      if (poll.data.status === 'pending') return

      if (pollTimer.current) clearInterval(pollTimer.current)
      setStatus('signing-in')
      setAuth(poll.data.accessToken, poll.data.admin)
      router.push('/dashboard')
    }, 1200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-200 px-4">
      <div className="bg-white rounded-3xl shadow-[var(--shadow-popover)] w-full max-w-sm p-8 border border-canvas-300/60">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-black bg-brand-500 text-white shadow-sm">አ</div>
          <h1 className="text-2xl font-bold text-brand-700 tracking-tight">Aroge</h1>
          <p className="text-sm mt-1 text-ink-400">Backoffice Admin</p>
        </div>

        <p className="text-sm text-center mb-6 text-ink-500">
          Sign in with the Telegram account your admin access was set up with.
        </p>

        {(status === 'idle' || status === 'starting') && (
          <Button variant="primary" className="w-full" onClick={startLogin} disabled={status === 'starting'}>
            {status === 'starting' ? 'Starting…' : 'Continue with Telegram'}
          </Button>
        )}

        {status === 'waiting' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-brand-600">
              Telegram should have opened — tap the &ldquo;Log in to Aroge&rdquo; button there.
            </p>
            <a href={deepLink} className="text-xs underline text-brand-600 hover:text-brand-700">
              Didn&apos;t open? Tap here
            </a>
          </div>
        )}

        {status === 'signing-in' && (
          <p className="text-sm text-center text-brand-600">Signing in…</p>
        )}

        {error && (
          <p className="text-sm text-action-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  )
}
