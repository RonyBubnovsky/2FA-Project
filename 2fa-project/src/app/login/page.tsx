'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [twoFARequired, setTwoFARequired] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        // Use a dedicated API endpoint to check auth status
        const res = await fetch('/api/auth/status')
        const data = await res.json()
        
        if (data.authenticated) {
          router.replace('/dashboard')
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  // Check for logout success message
  useEffect(() => {
    if (searchParams) {
      const status = searchParams.get('status')
      if (status === 'logout_success') {
        toast.success('Logged out successfully', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#1E293B',
            color: '#fff',
            border: '1px solid #334155'
          },
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff'
          }
        })
        
        // Remove the status param from URL without refreshing the page
        const url = new URL(window.location.href)
        url.searchParams.delete('status')
        window.history.replaceState({}, '', url)
      }
    }
  }, [searchParams])

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
      const endpoint = isUsingRecoveryCode ? '/api/auth/recovery-code-verify' : '/api/auth/2fa-verify-login'
      const res = await fetch(endpoint, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ token, trustDevice: false })
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

  function toggleRecoveryCodeMode() {
    setIsUsingRecoveryCode(!isUsingRecoveryCode)
    setToken('')
    setError('')
  }

  if (isChecking) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <Toaster />
      <div className="w-full max-w-md">
        {twoFARequired ? (
          <div className="card">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
                {isUsingRecoveryCode ? 'Enter Recovery Code' : 'Enter 2FA Code'}
              </h2>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                {isUsingRecoveryCode 
                  ? 'Enter one of your recovery codes to access your account' 
                  : 'Enter the 6-digit code from your authenticator app'
                }
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
                  {isUsingRecoveryCode ? 'Recovery Code' : 'Authentication Code'}
                </label>
                <input
                  id="token"
                  type="text"
                  inputMode={isUsingRecoveryCode ? 'text' : 'numeric'}
                  pattern={isUsingRecoveryCode ? undefined : '[0-9]*'}
                  autoComplete={isUsingRecoveryCode ? 'off' : 'one-time-code'}
                  placeholder={isUsingRecoveryCode ? 'XXXX-XXXX' : '000000'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              {isUsingRecoveryCode && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md text-sm">
                  <p className="text-amber-700 dark:text-amber-500">
                    <strong>Note:</strong> Using a recovery code will disable 2FA on your account. You&apos;ll need to set it up again after logging in.
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={toggleRecoveryCodeMode}
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  {isUsingRecoveryCode 
                    ? 'Use authenticator app instead' 
                    : 'Lost your authenticator device?'
                  }
                </button>
              </div>
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
                  <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">
                    Forgot password?
                  </Link>
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
