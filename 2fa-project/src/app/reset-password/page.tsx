'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Password strength component (reused from register page)
function PasswordStrengthMeter({ password }: { password: string }) {
  // Calculate password strength
  const calculateStrength = (password: string) => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    
    return score;
  };
  
  const strength = calculateStrength(password);
  
  // Strength indicators
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    if (strength === 4) return 'Strong';
    if (strength === 5) return 'Very Strong';
    return '';
  };
  
  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-red-500';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    if (strength === 4) return 'bg-green-500';
    if (strength === 5) return 'bg-green-600';
    return '';
  };
  
  return (
    <div className="mt-1 mb-3">
      <div className="flex h-1 w-full rounded bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full w-1/5 ${level <= strength ? getStrengthColor(strength) : 'bg-secondary-200 dark:bg-secondary-700'}`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs mt-1 text-secondary-600 dark:text-secondary-400">
          Password strength: <span className="font-medium">{getStrengthLabel(strength)}</span>
        </p>
      )}
      {password && strength < 3 && (
        <p className="text-xs text-red-500 mt-1">
          Use at least 8 characters with uppercase, lowercase, numbers and special characters.
        </p>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [tokenChecked, setTokenChecked] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const searchParams = useSearchParams()
  
  const token = searchParams?.get('token') || null
  const email = searchParams?.get('email') || null
  
  // Validate the token when the page loads
  useEffect(() => {
    if (!token || !email) {
      setError('Invalid password reset link')
      setTokenChecked(true)
      return
    }
    
    // For better UX, we assume the token is valid and verify it on form submission
    // This avoids an extra API call and potential token leakage
    setIsTokenValid(true)
    setTokenChecked(true)
  }, [token, email])
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          email, 
          password 
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(true)
        setPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!tokenChecked) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-secondary-100 dark:bg-secondary-800 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }
  
  if (!isTokenValid) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {error || 'Invalid or expired password reset link.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="btn btn-primary">
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
              Create a new password for your account
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
                    Your password has been reset successfully.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/login" 
                  className="inline-flex justify-center items-center px-5 py-2.5 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 ease-in-out">
                  Go to Login
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
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  required
                />
                <PasswordStrengthMeter password={password} />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`input ${password !== confirmPassword && confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                {password !== confirmPassword && confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={isLoading || password !== confirmPassword}
                  className="btn btn-primary w-full py-3"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
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