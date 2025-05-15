'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingScreen from '../components/LoadingScreen'

export default function Setup2FAPage() {
  const [qr, setQr] = useState<string>()
  const [token, setToken] = useState('')
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status first
    fetch('/api/auth/2fa-setup')
      .then(r => {
        if (r.status === 401) {
          // User is not authenticated, redirect to login
          router.push('/login')
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return // Early return if redirect is happening
        if (data.enabled) {
          setTwoFAEnabled(true)
        } else {
          setQr(data.qr)
        }
        setInitialLoading(false)
      })
      .catch((err) => {
        setError('Failed to load 2FA information')
        console.error(err)
        setInitialLoading(false)
      })
  }, [router])

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/2fa-verify-setup', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ token, trustDevice })
      })
      const data = await res.json()
      if (res.ok) router.push('/dashboard')
      else setError(data.error)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function disable2FA(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/auth/2fa-disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFAEnabled(false)
        setShowDisableConfirm(false)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Failed to disable 2FA')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state first
  if (initialLoading) {
    return <LoadingScreen message="Checking 2FA status..." />
  }

  // 2FA is already enabled, show management UI
  if (twoFAEnabled) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
                Manage Two-Factor Authentication
              </h2>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Two-factor authentication is currently enabled for your account
              </p>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 mb-6 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            {showDisableConfirm ? (
              <div>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg mb-6">
                  <h3 className="text-amber-800 dark:text-amber-400 font-medium">Disable 2FA Confirmation</h3>
                  <p className="text-amber-700 dark:text-amber-500 mt-1 text-sm">
                    This will make your account less secure. To disable 2FA, please enter the code from your authenticator app.
                  </p>
                </div>
                
                <form onSubmit={disable2FA} className="space-y-6">
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
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDisableConfirm(false)}
                      className="btn btn-secondary flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-danger flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Disable 2FA'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg mb-6">
                  <p className="text-green-700 dark:text-green-500">
                    Your account is protected with two-factor authentication. You will need your authenticator app whenever you sign in.
                  </p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-800">
                  <button
                    type="button"
                    onClick={() => setShowDisableConfirm(true)}
                    className="btn btn-outline-danger w-full"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular setup UI
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
              Set up Two-Factor Authentication
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Scan the QR code with Google Authenticator or another TOTP app
            </p>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 mb-6 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          
          {qr ? (
            <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg mb-6 flex justify-center">
              <img src={qr} alt="QR code" className="max-w-full h-auto" />
            </div>
          ) : (
            <div className="flex justify-center items-center h-48 bg-secondary-50 dark:bg-secondary-800 rounded-lg mb-6">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-secondary-300 dark:bg-secondary-600 rounded-full"></div>
                <div className="h-2 w-2 bg-secondary-300 dark:bg-secondary-600 rounded-full"></div>
                <div className="h-2 w-2 bg-secondary-300 dark:bg-secondary-600 rounded-full"></div>
              </div>
            </div>
          )}
          
          <form onSubmit={verify} className="space-y-6">
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
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="trustDevice"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={e => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
              <div className="ml-3">
                <label htmlFor="trustDevice" className="text-sm text-secondary-600 dark:text-secondary-400">
                  Trust this device for 30 days
                </label>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading || !qr}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  If you lose access to your authenticator app, you'll need to contact support to regain access to your account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
