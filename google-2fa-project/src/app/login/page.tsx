'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [twoFARequired, setTwoFARequired] = useState(false)
  const [token, setToken] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password, remember: rememberDevice })
      })
      const data = await res.json()
      if (res.ok && data.twoFAEnabled && !data.isTrusted) {
        setTwoFARequired(true)
      } else if (res.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function verify2FA(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/2fa-verify-login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ token, trustDevice })
      })
      const data = await res.json()
      if (res.ok) router.push('/dashboard')
      else setError(data.error)
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
        {twoFARequired ? (
          <div className="card">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
                Enter 2FA Code
              </h2>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <form onSubmit={verify2FA} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Authentication Code
                </label>
                <input
                  id="token"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="trustDevice"
                  type="checkbox"
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900"
                  checked={trustDevice}
                  onChange={e => setTrustDevice(e.target.checked)}
                />
                <label htmlFor="trustDevice" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                  Remember this device for 30 days
                </label>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Sign in to your account
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Password
                  </label>
                  <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input mt-1"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="rememberDevice"
                  type="checkbox"
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 dark:border-secondary-700 dark:bg-secondary-900"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                />
                <label htmlFor="rememberDevice" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-300">
                  Remember this device for 30 days
                </label>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-3"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-800 text-center">
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Don&apos;t have an account?{' '}
                <a href="/register" className="font-semibold text-primary-600 hover:text-primary-500">Sign up</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
