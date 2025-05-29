'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const token = searchParams?.get('token')
    if (!token) {
      setStatus('error')
      setErrorMessage('Missing verification token')
      return
    }
    
    async function verifyEmail() {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setStatus('success')
          if (data.verificationSuccessToken) {
            setVerificationToken(data.verificationSuccessToken)
          }
        } else {
          setStatus('error')
          setErrorMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setErrorMessage('An unexpected error occurred')
        console.error(error)
      }
    }
    
    verifyEmail()
  }, [searchParams])
  
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-pulse flex space-x-2 justify-center mb-4">
                <div className="h-3 w-3 bg-primary-400 rounded-full"></div>
                <div className="h-3 w-3 bg-primary-500 rounded-full"></div>
                <div className="h-3 w-3 bg-primary-600 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                Just a moment while we verify your email address...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                Email Verified
              </h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
                Your email address has been successfully verified. You can now access all features.
              </p>
              <div className="flex justify-center">
                <Link 
                  href={verificationToken ? `/login?status=email_verified&token=${verificationToken}` : "/login"} 
                  className="btn btn-primary py-2 px-6"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mx-auto w-16 h-16 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                Verification Failed
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                {errorMessage || 'Something went wrong during verification'}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">
                The verification link may be expired or invalid. Please try requesting a new verification email.
              </p>
              <div className="flex flex-col space-y-3">
                <Link href="/login" className="btn btn-primary py-2 px-6">
                  Return to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
