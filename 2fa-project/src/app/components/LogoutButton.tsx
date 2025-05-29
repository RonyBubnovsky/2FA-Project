'use client'

import { useState } from 'react'

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        // Redirect to login with success status parameter
        window.location.href = '/login?status=logout_success';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm whitespace-nowrap"
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <svg className="animate-spin h-4 w-4 mr-1.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing out...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </>
      )}
    </button>
  );
} 