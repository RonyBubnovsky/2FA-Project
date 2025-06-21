import './globals.css'
import Script from 'next/script'
import MobileMenu from './components/MobileMenu'
import Link from 'next/link'

export const metadata = { 
  title: 'My 2FA App',
  description: 'Secure authentication with 2FA support'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script id="theme-switcher" strategy="beforeInteractive">
          {`
            document.documentElement.classList.add('dark');
          `}
        </Script>
      </head>
      <body className="bg-secondary-50 dark:bg-secondary-950 min-h-screen flex flex-col">
        <MobileMenu />
        
        <main className="flex-1 container-custom py-10">
          {children}
        </main>
          <footer className="border-t border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-950">
          <div className="container-custom py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div>
                <Link href="/" className="font-display text-xl font-semibold text-primary-600 dark:text-primary-500">My2FAApp</Link>
                <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                  Secure authentication with two-factor protection for your applications.
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/contact" 
                  className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                >
                  Contact
                </Link>
                <Link 
                  href="/privacy-terms" 
                  className="text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors"
                >
                  Privacy & Terms
                </Link>
              </div>
            </div>
            <div className="mt-8 border-t border-secondary-200 dark:border-secondary-800 pt-6">
              <p className="text-xs text-secondary-600 dark:text-secondary-400">© 2025 My2FAApp. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
