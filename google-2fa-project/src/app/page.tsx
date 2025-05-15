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
            Why Two-Factor<br />Authentication Matters
          </h1>
          <p className="mt-6 text-lg leading-8 text-secondary-600 dark:text-secondary-400">
            Protecting your digital identity in an increasingly vulnerable online world
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
              <div className="card p-8 bg-secondary-800 dark:bg-secondary-900">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">Beyond Passwords</h3>
                    <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">Passwords alone are vulnerable to phishing, credential stuffing, and data breaches. 2FA adds a critical second layer of protection.</p>
                  </div>
                  <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">Time-based Security</h3>
                    <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">TOTP generates one-time codes that expire quickly, making stolen credentials useless without the authenticator device.</p>
                  </div>
                  <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white">Account Recovery</h3>
                    <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">Robust recovery options ensure you never lose access to your account, even if you lose your authentication device.</p>
                  </div>
                </div>
                <div className="mt-10 py-8 border-t-2 border-secondary-300 dark:border-secondary-600">
                  <h3 className="text-lg font-medium text-white text-center mb-4">About This Project</h3>
                  <p className="text-center text-secondary-200 dark:text-secondary-300 max-w-2xl mx-auto">
                    This 2FA authentication system was developed as a final project for the Software Safety course. 
                    It demonstrates secure authentication practices using modern web technologies and showcases 
                    how to implement robust user protection in accordance with OWASP security guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 sm:mt-32">
          <div className="mx-auto max-w-full text-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              2FA Authentication Demo
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
