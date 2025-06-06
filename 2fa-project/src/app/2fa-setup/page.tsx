'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingScreen from '../components/LoadingScreen'
import { Toaster, toast } from 'react-hot-toast'
import InactivityMonitor from '../components/InactivityMonitor'

export default function Setup2FAPage() {
  const [qr, setQr] = useState<string>()
  const [secret, setSecret] = useState<string>()
  const [showSecret, setShowSecret] = useState(false)
  const [isLoadingSecret, setIsLoadingSecret] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
  const router = useRouter()
  
  // Always false for 2FA setup page - no longer allowing users to trust device here
  const trustDevice = false

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
      .catch((error) => {
        setError('Failed to load 2FA information')
        console.error(error)
        setInitialLoading(false)
      })
  }, [router])

  // Function to fetch the secret when user clicks "Show code"
  const fetchSecret = async () => {
    if (secret) {
      setShowSecret(true)
      return
    }

    setIsLoadingSecret(true)
    try {
      const res = await fetch('/api/auth/get-2fa-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch secret')
      }
      
      const data = await res.json()
      setSecret(data.secret)
      setShowSecret(true)
    } catch (err) {
      console.error(err)
      setError('Failed to load secret code')
    } finally {
      setIsLoadingSecret(false)
    }
  }

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
      if (res.ok) {
        if (data.recoveryCodes && data.recoveryCodes.length > 0) {
          setRecoveryCodes(data.recoveryCodes)
          setShowRecoveryCodes(true)
        } else {
          router.push('/dashboard')
        }
      }
      else setError(data.error)
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
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
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle case when user confirms they&apos;ve saved recovery codes
  function handleRecoveryCodesContinue() {
    setShowRecoveryCodes(false)
    router.push('/dashboard')
  }

  // Show loading state first
  if (initialLoading) {
    return <LoadingScreen message="Checking 2FA status..." />
  }

  // Return all components wrapped in the InactivityMonitor
  return (
    <InactivityMonitor>
      {/* Show recovery codes after successful 2FA setup */}
      {showRecoveryCodes ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
          <Toaster />
          <div className="w-full max-w-md">
            <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white">
                  Save Your Recovery Codes
                </h2>
                <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">
                  Store these codes in a safe place. They can be used to regain access to your account if you lose your authenticator device.
                </p>
              </div>
              
              <div className="bg-secondary-700 dark:bg-secondary-800 p-4 rounded-lg mb-6 border-2 border-secondary-300 dark:border-secondary-600">
                <div className="grid grid-cols-2 gap-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-center text-secondary-200 dark:text-secondary-300 p-2 bg-secondary-900 rounded border border-secondary-600">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-amber-900/20 dark:bg-amber-900/30 p-4 rounded-lg mb-6 border border-amber-700/40">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-400">
                      <strong>Important:</strong> Each code can only be used once. If you use a recovery code, your 2FA will be automatically disabled and you&apos;ll need to set it up again.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    const text = recoveryCodes.join('\n')
                    navigator.clipboard.writeText(text)
                    toast.success('Recovery codes copied to clipboard', {
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
                  }}
                  className="btn btn-secondary w-full py-3"
                >
                  Copy to Clipboard
                </button>
                
                <button
                  onClick={handleRecoveryCodesContinue}
                  className="btn btn-primary w-full py-3"
                >
                  I&apos;ve Saved My Recovery Codes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : twoFAEnabled ? (
        <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
          <Toaster />
          <div className="w-full max-w-md">
            <div className="card bg-secondary-800 dark:bg-secondary-900 text-white p-8 shadow-lg rounded-lg border border-secondary-700">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Manage Two-Factor Authentication
                </h2>
                <p className="text-secondary-200 dark:text-secondary-300">
                  Two-factor authentication is currently enabled for your account
                </p>
              </div>
              
              {error && (
                <div className="rounded-md bg-red-900/20 p-4 mb-6 text-sm text-red-400 border border-red-800/40">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {showDisableConfirm ? (
                <div>
                  <div className="bg-amber-900/20 p-4 rounded-lg mb-6 border border-amber-700/40">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-amber-400 font-medium">Disable 2FA Confirmation</h3>
                        <p className="text-amber-300 mt-1 text-sm">
                          This will make your account less secure. To disable 2FA, please enter the code from your authenticator app.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={disable2FA} className="space-y-6">
                    <div>
                      <label htmlFor="token" className="block text-sm font-medium text-secondary-300 mb-2">
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
                        className="w-full px-4 py-3 bg-secondary-700 border border-secondary-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-md text-white placeholder-secondary-400"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-3 mt-6">
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm hover:shadow transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                            Disable 2FA
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableConfirm(false)}
                        className="w-full py-3 px-4 bg-secondary-600 hover:bg-secondary-500 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="bg-green-900/20 p-5 rounded-lg mb-8 border border-green-700/40">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500/20 p-2 rounded-full">
                        <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-green-400 font-medium text-lg">
                          Your account is protected with two-factor authentication.
                        </p>
                        <p className="text-green-500 mt-1 text-sm">
                          You will need your authenticator app whenever you sign in.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-secondary-700 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-secondary-200 mb-2">Account Security</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-secondary-300">Unauthorized access prevention</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-secondary-300">Protection against credential theft</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-secondary-700">
                    <button
                      type="button"
                      onClick={() => setShowDisableConfirm(true)}
                      className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-md transition-colors flex justify-center items-center"
                    >
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      Disable Two-Factor Authentication
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-6 border-t border-secondary-700 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="text-primary-400 hover:text-primary-300 font-medium flex items-center justify-center mx-auto"
                >
                  <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
          <Toaster />
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
                <div>
                  <div className="bg-white dark:bg-secondary-800 p-4 rounded-lg mb-4 flex justify-center">
                    {/* Using a data URL with Next Image requires width and height */}
                    <div 
                      dangerouslySetInnerHTML={{ __html: `<img src="${qr}" alt="QR code" className="max-w-full h-auto" />` }}
                    />
                  </div>
                  
                  <div className="mt-3 mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                        Manual entry code
                      </span>
                      <button 
                        type="button"
                        onClick={() => showSecret ? setShowSecret(false) : fetchSecret()}
                        className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none"
                      >
                        {isLoadingSecret ? 'Loading...' : (showSecret ? 'Hide' : 'Show')} code
                      </button>
                    </div>
                    <div className="bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 p-3 rounded-md flex items-center justify-between">
                      {showSecret ? (
                        <span className="font-mono text-sm select-all break-all overflow-x-auto max-w-[calc(100%-2rem)]">{secret}</span>
                      ) : (
                        <span className="text-secondary-500 dark:text-secondary-400 text-sm">●●●●●●●●●●●●●●●●●●●●●●●●</span>
                      )}
                      {secret && (
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(secret);
                            toast.success('Secret key copied to clipboard', {
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
                            });
                          }}
                          className="ml-2 text-primary-600 hover:text-primary-500 focus:outline-none flex-shrink-0"
                          aria-label="Copy to clipboard"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-secondary-500 dark:text-secondary-400">
                      If you can&apos;t scan the QR code, you can manually enter this code into your authenticator app.
                    </p>
                  </div>
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
                      If you lose access to your authenticator app, you&apos;ll need to use one of your recovery codes to regain access to your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </InactivityMonitor>
  )
}
