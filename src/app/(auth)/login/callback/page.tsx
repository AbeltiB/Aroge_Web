'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '../../../../lib/api'

// oauth.telegram.org redirects the browser back here with the signed
// Telegram payload as query params. This tab's only job is to hand that
// payload to the API (which writes the result into the same pending-login
// record the /login tab is polling) and tell the person they can close it —
// the /login tab is the one that actually completes sign-in.
function CallbackContent() {
  const params = useSearchParams()
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

    api.post('/auth/telegram/bot/oauth-callback', {
      token,
      id: Number(id),
      first_name: params.get('first_name') ?? '',
      last_name: params.get('last_name') ?? undefined,
      username: params.get('username') ?? undefined,
      photo_url: params.get('photo_url') ?? undefined,
      auth_date: Number(authDate),
      hash,
    }).then((res) => {
      setMessage(res.success ? "You're logged in! You can close this tab." : res.message)
    }).catch(() => {
      setMessage('Network error. Close this tab and try again from Aroge.')
    })
  }, [params])

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
