'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        setEmail('')
      } else {
        setError(data.error || 'Failed to process request')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>
          
          {success ? (
            <div className="rounded-md bg-green-50 dark:bg-green-900/10 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    If your email address exists in our database, you will receive a password recovery link shortly.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/login" className="btn btn-primary w-full py-3">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-3"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-primary-600 hover:text-primary-500">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 