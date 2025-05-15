import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../lib/session'

interface SessionData {
  userId?: string
  twoFAVerified?: boolean
}

export default async function Home() {
  // Check if user is logged in
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  // Redirect to dashboard if user is logged in and has verified 2FA
  if (session.userId && session.twoFAVerified) {
    redirect('/dashboard')
  }

  return (
    <div className="relative isolate pt-14 lg:pt-20">
      {/* Background gradient */}
      <div className="absolute inset-x-0 top-4 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-200 to-primary-500 opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-display font-bold tracking-tight text-secondary-900 dark:text-secondary-100 sm:text-6xl">
            Secure Authentication<br />with 2FA Protection
          </h1>
          <p className="mt-6 text-lg leading-8 text-secondary-600 dark:text-secondary-400">
            A modern authentication system with two-factor protection, built with Next.js, TypeScript, and MongoDB
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="/register" className="btn btn-primary px-6 py-3 text-base">
              Get Started
            </a>
            <a href="/login" className="btn btn-outline px-6 py-3 text-base">
              Sign In <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="mt-16 flow-root sm:mt-24">
          <div className="-m-2 rounded-xl bg-secondary-900/5 dark:bg-secondary-100/5 p-2 ring-1 ring-inset ring-secondary-900/10 dark:ring-secondary-100/10 lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="rounded-md bg-background shadow-2xl ring-1 ring-secondary-900/10 dark:ring-secondary-100/10">
              <div className="card p-8">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-secondary-900 dark:text-secondary-100">Enhanced Security</h3>
                    <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">Two-factor authentication adds an extra layer of security to your applications.</p>
                  </div>
                  <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-secondary-900 dark:text-secondary-100">Time-based OTP</h3>
                    <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">Compatible with Google Authenticator and other TOTP apps.</p>
                  </div>
                  <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-secondary-900 dark:text-secondary-100">Email Verification</h3>
                    <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">Verify user identities with secure email verification.</p>
                  </div>
                </div>
                <div className="mt-10 py-8 border-t border-secondary-100 dark:border-secondary-800">
                  <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 text-center mb-4">Built with modern technologies</h3>
                  <div className="flex flex-wrap justify-center gap-8">
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <span className="font-medium">Next.js</span>
                    </div>
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <span className="font-medium">TypeScript</span>
                    </div>
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <span className="font-medium">MongoDB</span>
                    </div>
                    <div className="flex items-center text-secondary-600 dark:text-secondary-400">
                      <span className="font-medium">Tailwind CSS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 sm:mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-display font-bold tracking-tight text-secondary-900 dark:text-secondary-100 sm:text-3xl">Ready to get started?</h2>
            <p className="mt-4 text-base text-secondary-600 dark:text-secondary-400">
              Set up your secure authentication in minutes.
            </p>
            <div className="mt-6 flex items-center justify-center gap-x-6">
              <a href="/register" className="btn btn-primary px-6 py-3 text-base">
                Create account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
