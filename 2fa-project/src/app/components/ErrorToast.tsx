'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

export default function ErrorToast() {
  const searchParams = useSearchParams()
  const shownErrorsRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    // Check for error parameters
    const error = searchParams?.get('error')
    
    if (error === '2fa-required' && !shownErrorsRef.current.has('2fa-required')) {
      // Mark this error as shown to prevent duplicates
      shownErrorsRef.current.add('2fa-required')
      
      toast.error((t) => (
        <div className="flex items-start">
          <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
          <span>2FA required: Enable Two-Factor Authentication to access the security quiz</span>
        </div>
      ), {
        id: '2fa-required-toast', // Use a unique ID to prevent duplicates
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #334155',
          paddingRight: '16px'
        },
      })
      
      // Remove the error param from URL without refreshing the page
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url)
    }
  }, [searchParams])

  return <Toaster />
} 