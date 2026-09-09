'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth.store'
import type { JwtAdminPayload } from '@arogenpm/sdk'

type PollResponse =
  | { status: 'pending' }
  | { status: 'verified'; accessToken: string; admin: JwtAdminPayload & { name: string } }

// Telegram redirects here (after the Login URL button is confirmed) with
// the signed payload as query params. Rather than just telling the person
// to switch back to the original /login tab, this tab completes the sign-in
// itself and jumps straight to the dashboard — whichever tab they're
// actually looking at, one of them lands them there.
function CallbackContent() {
  const router = useRouter()
  const params = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [message, setMessage] = useState('Signing you in…')

  useEffect(() => {
    const token = params.get('token')
    const id = params.get('id')
    const hash = params.get('hash')
    const authDate = params.get('auth_date')

    if (!token || !id || !hash || !authDate) {
      setMessage('Missing login data. Close this tab and try again from Aroge.')
      return
    }

    async function finish() {
      const callback = await api.post('/auth/telegram/bot/oauth-callback', {
        token,
        id: Number(id),
        first_name: params.get('first_name') ?? '',
        last_name: params.get('last_name') ?? undefined,
        username: params.get('username') ?? undefined,
        photo_url: params.get('photo_url') ?? undefined,
        auth_date: Number(authDate),
        hash,
      })
      if (!callback.success) {
        setMessage(callback.message)
        return
      }

      // Mobile (marketplace) logins aren't a browser session this admin
      // web app can complete — the token belongs to the Aroge mobile app,
      // which is polling for it independently. Confirming here is enough;
      // consuming the token is left entirely to the app's own poll.
      if (params.get('intent') === 'user') {
        setMessage("You're logged in! Return to the Aroge app to continue.")
        return
      }

      // The record was just marked verified — poll picks it up immediately,
      // with a couple of quick retries only to absorb any tiny timing gap.
      for (let attempt = 0; attempt < 3; attempt++) {
        const poll = await api.get<PollResponse>(`/auth/telegram/bot/poll/${token}`)
        if (poll.success && poll.data.status === 'verified') {
          setAuth(poll.data.accessToken, poll.data.admin)
          setMessage("You're logged in! Redirecting…")
          router.replace('/dashboard')
          return
        }
        if (poll.success && poll.data.status === 'pending') {
          await new Promise((resolve) => setTimeout(resolve, 400))
          continue
        }
        setMessage(poll.success ? 'Something went wrong. Close this tab and try again.' : poll.message)
        return
      }
      setMessage('Taking longer than expected — close this tab and check the original one.')
    }

    finish().catch(() => setMessage('Network error. Close this tab and try again from Aroge.'))
  }, [params, router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f3efe7' }}>
      <p className="text-sm text-center px-8" style={{ color: '#1f7a5a' }}>{message}</p>
    </div>
  )
}

export default function LoginCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  )
}
