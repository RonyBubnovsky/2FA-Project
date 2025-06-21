'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NavigationProps {
  isAuthenticated: boolean
}

export default function Navigation({ isAuthenticated }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-secondary-200 dark:border-secondary-800 bg-white/80 dark:bg-secondary-950/80 backdrop-blur-lg">
        <div className="container-custom flex h-16 items-center justify-between">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="font-display text-2xl font-semibold tracking-tight text-primary-600 dark:text-primary-500">
            My2FAApp
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="bg-secondary-800 hover:bg-secondary-700 text-white hover:text-white font-medium px-5 py-2.5 rounded-md transition-colors duration-200">
                  Sign In
                </Link>
                <Link href="/register" className="bg-primary-600 hover:bg-primary-500 text-white hover:text-white font-medium px-5 py-2.5 rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                  Get Started
                </Link>
              </>
            ) : (
              <Link href="/dashboard" className="bg-secondary-700 hover:bg-secondary-600 text-white hover:text-white font-medium px-5 py-2.5 rounded-md transition-colors duration-200">
                Dashboard
              </Link>
            )}
          </nav>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center rounded-md p-2 text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="12" y2="12"></line>
                <line x1="4" x2="20" y1="6" y2="6"></line>
                <line x1="4" x2="20" y1="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-secondary-950/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-secondary-950 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-secondary-200 dark:sm:ring-secondary-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <Link href={isAuthenticated ? "/dashboard" : "/"} className="font-display text-2xl font-semibold tracking-tight text-primary-600 dark:text-primary-500">My2FAApp</Link>
              <button 
                type="button" 
                className="rounded-md p-2.5 text-secondary-600 hover:text-secondary-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
            <div className="flow-root">
              <div className="py-6 space-y-4">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" className="block w-full py-3 font-medium text-center bg-secondary-800 text-white hover:text-white rounded-md hover:bg-secondary-700 transition-colors duration-200">Sign In</Link>
                    <Link href="/register" className="block w-full py-3 font-medium text-center bg-primary-600 text-white hover:text-white rounded-md hover:bg-primary-500 transition-colors duration-200">Get Started</Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="block w-full py-3 font-medium text-center bg-secondary-700 text-white hover:text-white rounded-md hover:bg-secondary-600 transition-colors duration-200">Dashboard</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
