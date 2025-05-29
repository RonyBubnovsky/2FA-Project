import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../lib/session'
import LogoutButton from '../components/LogoutButton'
import DeleteUserButton from '../components/DeleteUserButton'
import ChangePasswordButton from '../components/ChangePasswordButton'
import ErrorToast from '../components/ErrorToast'
import ResendVerificationButton, { ResendButtonLarge } from '../components/ResendVerificationButton'
import dbConnect from '../../lib/mongodb'
import { User } from '../../models/User'

interface SessionData {
  userId?: string
  twoFAVerified?: boolean
  tempSecret?: string
  email?: string
  firstName?: string
  lastName?: string
  emailVerified?: boolean
}

export default async function Dashboard() {
  // Get the cookie header directly
  const cookieStore = await cookies()
  
  // Create an iron session using the cookie store
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.userId || !session.twoFAVerified) {
    redirect('/login')
  }

  // Connect to database and get user data
  await dbConnect()
  const user = await User.findById(session.userId)
  if (!user) {
    redirect('/login')
  }

  const is2FAEnabled = user.twoFA?.enabled || false
  const isEmailVerified = user.emailVerified || session.emailVerified || false

  // Use session data directly
  const fullName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';

  return (
    <div className="max-w-7xl mx-auto">
      <ErrorToast />
      
      {!isEmailVerified && (
        <div className="bg-amber-600 dark:bg-amber-700 mb-6 rounded-lg shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <h3 className="text-lg font-bold text-white">Email Verification Required</h3>
                <p className="mt-1 text-white">
                  Your email address ({session.email}) has not been verified. Please check your inbox for a verification link or request a new one.
                </p>
                <div className="mt-3 flex space-x-4">
                  <ResendVerificationButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="rounded-lg border border-secondary-300 dark:border-secondary-600 bg-secondary-800 dark:bg-secondary-900 p-8 shadow-soft-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-secondary-200 dark:text-secondary-300">
              Welcome back, {fullName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
            <ChangePasswordButton />
            <DeleteUserButton />
            <LogoutButton />
          </div>
        </div>
        
        {!isEmailVerified ? (
          <div className="bg-secondary-700 dark:bg-secondary-800 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email to Access Dashboard Features</h2>
            <p className="text-secondary-300 max-w-xl mx-auto mb-6">
              You need to verify your email address before you can access the features of this dashboard. Please check your inbox for a verification link or request a new one.
            </p>
            <ResendButtonLarge />
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Security Status</h3>
                <div className="mt-2 flex items-center">
                  <div className="flex-shrink-0">
                    <span className="h-2 w-2 rounded-full bg-green-400 inline-block mr-2"></span>
                  </div>
                  <p className="text-sm text-secondary-200 dark:text-secondary-300">
                    {session.twoFAVerified && 'Verification complete' + (is2FAEnabled ? '' : ' (2FA not enabled)')}
                  </p>
                </div>
                {!is2FAEnabled && (
                  <div className="mt-3">
                    <p className="text-xs text-amber-400">
                      Two-factor authentication is not enabled for your account
                    </p>
                    <a href="/2fa-setup" className="mt-2 inline-block text-sm font-medium px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors duration-200">
                      Enable 2FA now
                    </a>
                  </div>
                )}
              </div>
              
              <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Last Login</h3>
                <p className="mt-2 text-sm text-secondary-200 dark:text-secondary-300">
                  {new Intl.DateTimeFormat('en-IL', {
                    dateStyle: 'medium',
                    timeZone: 'Asia/Jerusalem'
                  }).format(new Date())} at {new Intl.DateTimeFormat('en-IL', {
                    timeStyle: 'medium',
                    timeZone: 'Asia/Jerusalem'
                  }).format(new Date())}
                </p>
              </div>
              
              <div className="rounded-lg border-2 border-secondary-300 dark:border-secondary-600 bg-secondary-700 dark:bg-secondary-800 p-6 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-white">Settings</h3>
                <a href="/2fa-setup" className="mt-3 inline-block text-sm font-medium px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors duration-200">
                  {is2FAEnabled ? 'Manage 2FA settings' : 'Enable 2FA security'}
                </a>
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-display font-bold text-white mb-4">
                Protected Content
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="bg-secondary-900 p-6 rounded-lg border-2 border-secondary-300 dark:border-secondary-600 text-secondary-200 dark:text-secondary-300 shadow-lg">
                  <h3 className="text-lg font-medium text-white mb-2">Secure Access</h3>
                  <p>This page is protected and cannot be accessed if no active session is available.</p>
                  <p>You can only see this content after successfully verifying your identity.</p>
                </div>
                
                <div className="bg-secondary-900 p-6 rounded-lg border-2 border-secondary-300 dark:border-secondary-600 text-secondary-200 dark:text-secondary-300 shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 dark:bg-primary-700 text-white mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white">2FA Security Quiz</h3>
                  </div>
                  
                  {is2FAEnabled ? (
                    <>
                      <p className="mb-4">Test your knowledge about Two-Factor Authentication security with our interactive quiz. Available exclusively for users with 2FA enabled.</p>
                      <a href="/2fa-quiz" className="inline-block mt-2 text-sm font-medium px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors duration-200">
                        Take the Quiz
                      </a>
                    </>
                  ) : (
                    <>
                      <div className="p-3 border border-amber-600/30 bg-amber-950/20 rounded-md mb-4">
                        <div className="flex items-start">
                          <svg className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                          </svg>
                          <p className="text-amber-400 text-sm">This quiz is only available for accounts with 2FA enabled</p>
                        </div>
                      </div>
                      <p className="mb-4">Enable Two-Factor Authentication to access our interactive security quiz and test your knowledge of 2FA concepts and best practices.</p>
                      <a href="/2fa-setup" className="inline-block mt-2 text-sm font-medium px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-md transition-colors duration-200 flex items-center">
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                        </svg>
                        Enable 2FA Now
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


