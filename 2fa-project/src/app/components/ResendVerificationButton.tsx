'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

export default function ResendVerificationButton() {
  const [isLoading, setIsLoading] = useState(false)
  
  const resendVerificationEmail = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Verification email sent! Please check your inbox.', {
          duration: 5000,
          position: 'top-center',
        })
      } else {
        toast.error(data.error || 'Failed to send verification email', {
          duration: 5000,
          position: 'top-center',
        })
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        duration: 5000,
        position: 'top-center',
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      className="bg-white text-amber-800 hover:bg-amber-100 px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-amber-700 focus:ring-white"
      onClick={resendVerificationEmail}
      disabled={isLoading}
    >
      {isLoading ? 'Sending...' : 'Resend Verification Email'}
    </button>
  )
}

export function ResendButtonLarge() {
  const [isLoading, setIsLoading] = useState(false)
  
  const resendVerificationEmail = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await res.json()
      
      if (res.ok) {
        toast.success('Verification email sent! Please check your inbox.', {
          duration: 5000,
          position: 'top-center',
        })
      } else {
        toast.error(data.error || 'Failed to send verification email', {
          duration: 5000,
          position: 'top-center',
        })
      }
    } catch (error) {
      toast.error('An unexpected error occurred', {
        duration: 5000,
        position: 'top-center',
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <button
      type="button"
      className="btn btn-primary py-3 px-6"
      onClick={resendVerificationEmail}
      disabled={isLoading}
    >
      {isLoading ? 'Sending Verification Email...' : 'Resend Verification Email'}
    </button>
  )
} 