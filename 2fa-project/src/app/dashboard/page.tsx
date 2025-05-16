import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../lib/session'
import LogoutButton from '../components/LogoutButton'
import DeleteUserButton from '../components/DeleteUserButton'
import dbConnect from '../../lib/mongodb'
import { User } from '../../models/User'

interface SessionData {
  userId?: string
  twoFAVerified?: boolean
  tempSecret?: string
  email?: string
  firstName?: string
  lastName?: string
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

  // Use session data directly
  const fullName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';

  return (
    <div className="max-w-7xl mx-auto">
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
          <div className="flex gap-5">
            <DeleteUserButton />
            <LogoutButton />
          </div>
        </div>
        
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
          <div className="bg-secondary-900 p-4 rounded-lg border-2 border-secondary-300 dark:border-secondary-600 text-secondary-200 dark:text-secondary-300 shadow-lg">
            <p>This page is protected and cannot be accessed if no active session is available.</p>
            <p>You can only see this content after successfully verifying your identity.</p>
          </div>
        </div>
      </div>
    </div>
  )
}


