'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, ShieldCheck, Package } from 'lucide-react'
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
    <div className="h-screen w-full overflow-hidden flex flex-col md:flex-row">
      {/* Left brand panel */}
      <div className="hidden md:flex md:w-[42%] h-full flex-col justify-between bg-brand-600 text-white p-12 relative overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-white text-brand-700 flex-shrink-0">አ</div>
          <span className="text-base font-medium">Aroge Admin</span>
        </div>

        <div className="mt-20">
          <h1 className="text-[34px] leading-[1.15] font-bold max-w-[320px]">
            Manage Your Marketplace with Confidence
          </h1>
          <p className="text-[15px] text-white/80 mt-4 max-w-[300px]">
            Secure order fulfillment, escrow, and payouts across the Aroge marketplace.
          </p>

          {/* Decorative floating cards */}
          <div className="relative mt-16 h-56 w-full max-w-[300px]">
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <line x1="70" y1="55" x2="160" y2="140" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            <div className="absolute left-0 top-0 w-44 rounded-xl bg-white text-ink-900 shadow-popover p-3.5 font-mono text-[11px] leading-relaxed">
              <p>{'{'}</p>
              <p className="pl-2 text-ink-500">"orderId": <span className="text-brand-700">"ORD-8825"</span>,</p>
              <p className="pl-2 text-ink-500">"buyer": <span className="text-brand-700">"abel****"</span>,</p>
              <p className="pl-2 text-ink-500">"seller": <span className="text-brand-700">"haile****"</span>,</p>
              <p className="pl-2 text-ink-500">"amount": <span className="text-brand-700">"1,250 ETB"</span></p>
              <p>{'}'}</p>
            </div>
            <div className="absolute left-16 top-24 w-48 rounded-xl bg-white text-ink-900 shadow-popover p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ink-900 flex items-center justify-center flex-shrink-0">
                <Package size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">ORD-8825</p>
                <p className="text-sm font-bold">1,250 ETB</p>
                <p className="text-[10px] text-ink-400">Jan 21, 2026</p>
              </div>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 w-fit">
          <ShieldCheck size={14} />
          <span className="text-xs font-medium">Bank-grade escrow, powered by Aroge</span>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="flex-1 h-full relative flex items-center justify-center p-6"
        style={{
          background: 'linear-gradient(180deg, #cfe4f5 0%, #e8f1f9 45%, #f7fafc 100%)',
        }}
      >
        <div className="relative z-10 bg-white/90 backdrop-blur rounded-2xl shadow-popover p-10 sm:p-12 w-full max-w-[420px] border border-white/60">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-11">
              <div className="absolute left-0 top-0 w-11 h-11 rounded-full bg-[#229ED9] flex items-center justify-center shadow-sm">
                <Send size={18} className="text-white" />
              </div>
              <div className="absolute left-6 top-0 w-11 h-11 rounded-full bg-brand-500 flex items-center justify-center shadow-sm text-white font-bold text-sm">
                አ
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink-900 text-center">Welcome Back</h2>
          <p className="text-sm text-ink-500 text-center mt-1.5 mb-7">
            Sign in to your account with your Telegram account
          </p>

          {(status === 'idle' || status === 'starting') && (
            <button
              onClick={startLogin}
              disabled={status === 'starting'}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1c8ac0] text-white text-sm font-semibold rounded-lg px-4 py-3.5 transition-colors disabled:opacity-60"
            >
              <Send size={16} />
              {status === 'starting' ? 'Starting…' : 'Continue with Telegram'}
            </button>
          )}

          {status === 'waiting' && (
            <div className="text-center space-y-3 py-1">
              <p className="text-sm text-brand-600">
                Telegram should have opened — tap the &ldquo;Log in to Aroge&rdquo; button there.
              </p>
              <a href={deepLink} className="text-xs underline text-brand-600 hover:text-brand-700">
                Didn&apos;t open? Tap here
              </a>
            </div>
          )}

          {status === 'signing-in' && (
            <p className="text-sm text-center text-brand-600 py-1">Signing in…</p>
          )}

          {error && (
            <p className="text-sm text-action-600 text-center mt-4">{error}</p>
          )}

          <p className="text-xs text-ink-400 text-center mt-6 leading-relaxed">
            By continuing, you acknowledge and agree to the{' '}
            <a href="/terms" className="underline hover:text-ink-600">Terms of Service</a> and{' '}
            <a href="/privacy" className="underline hover:text-ink-600">Privacy Policy</a>
          </p>

          <div className="text-center mt-4">
            <a href="/" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Return Home</a>
          </div>
        </div>

        <p className="absolute bottom-4 inset-x-0 text-center text-[11px] text-ink-400">
          © 2026 Aroge. All rights reserved.
        </p>
      </div>
    </div>
  )
}
