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
            function applyTheme() {
              const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const userTheme = localStorage.getItem('theme');
              
              if (userTheme === 'dark' || (!userTheme && isDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            }
            
            // Apply theme on load
            applyTheme();
            
            // Watch for system preference changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
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
            <div>
              <Link href="/" className="font-display text-xl font-semibold text-primary-600 dark:text-primary-500">My2FAApp</Link>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                Secure authentication with two-factor protection for your applications.
              </p>
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
