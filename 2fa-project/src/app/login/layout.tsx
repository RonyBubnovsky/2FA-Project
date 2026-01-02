import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '../../lib/session'

interface SessionData {
  userId?: string
  twoFAVerified?: boolean
}

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already logged in (server-side)
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  // Redirect to dashboard if user is already authenticated
  if (session.userId && session.twoFAVerified) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
