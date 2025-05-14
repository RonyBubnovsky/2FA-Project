'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [msg, setMsg] = useState('Verifying…')
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        setMsg(data.ok ? 'Email verified! Redirecting…' : data.error)
        setTimeout(() => router.push('/login'), 3000)
      })
  }, [token, router])

  return <div className="text-center py-20"><p className="text-xl">{msg}</p></div>
}
