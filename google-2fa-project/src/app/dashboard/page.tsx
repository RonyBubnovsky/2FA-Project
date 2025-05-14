import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../lib/session'
import LogoutButton from '../components/LogoutButton'

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
  const cookieValue = cookieStore.get('my2fa_session')?.value || ''
  const req = { headers: { cookie: `my2fa_session=${cookieValue}` } } as any
  const res = {} as any
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  if (!session.userId || !session.twoFAVerified) {
    redirect('/login')
  }

  // Use session data directly
  const fullName = [session.firstName, session.lastName].filter(Boolean).join(' ') || session.email || 'User';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-lg border border-border bg-background p-8 shadow-soft-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-secondary-900 dark:text-secondary-100">
              Dashboard
            </h1>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              Welcome back, {fullName}
            </p>
          </div>
          <LogoutButton />
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-secondary-900 dark:text-secondary-100">Security Status</h3>
            <div className="mt-2 flex items-center">
              <div className="flex-shrink-0">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block mr-2"></span>
              </div>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                {session.twoFAVerified ? '2FA verification complete' : 'Authentication required'}
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-secondary-900 dark:text-secondary-100">Last Login</h3>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          
          <div className="rounded-lg border border-secondary-100 dark:border-secondary-800 bg-background p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-secondary-900 dark:text-secondary-100">Settings</h3>
            <a href="/2fa-setup" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-500">
              Manage 2FA settings
            </a>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-display font-bold text-secondary-900 dark:text-secondary-100 mb-4">
            Protected Content
          </h2>
          <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg text-secondary-700 dark:text-secondary-300">
            <p>This page is protected by password + two-factor authentication.</p>
            <p>You can only see this content after successfully verifying your identity.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

