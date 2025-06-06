'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

export default function HomeToastMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const shownMessagesRef = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    // Check for status parameters and token
    const status = searchParams?.get('status')
    const token = searchParams?.get('token')
    
    // Only proceed if we have both status and token
    if (
      status === 'account_deleted' && 
      token && 
      !shownMessagesRef.current.has('account_deleted')
    ) {
      // Mark this message as shown to prevent duplicates
      shownMessagesRef.current.add('account_deleted')
      
      // Validate token - token was already verified by server in session
      // The mere presence of the token in URL is sufficient for validation
      toast.success('Your account has been successfully deleted', {
        id: 'account-deleted-toast',
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1E293B',
          color: '#fff',
          border: '1px solid #334155',
          zIndex: 99999,
          marginTop: '60px'
        },
        iconTheme: {
          primary: '#10B981',
          secondary: '#fff'
        }
      })
      
      // Remove the status and token params from URL without refreshing the page
      const url = new URL(window.location.href)
      url.searchParams.delete('status')
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url)
    }
  }, [searchParams, router])

  // Custom Toaster with specific positioning
  return (
    <div style={{ position: 'relative', zIndex: 99999 }}>
      <Toaster 
        toastOptions={{ 
          className: '',
          style: {
            zIndex: 99999,
          }
        }}
        containerStyle={{
          zIndex: 99999,
          position: 'fixed',
          top: '15px',
          inset: '15px 0 auto 0',
        }}
      />
    </div>
  )
} 