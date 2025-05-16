import nodemailer from 'nodemailer'

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error('Define EMAIL_USER and EMAIL_PASS in .env.local')
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
  await transporter.sendMail({
    from: `"2FA App Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email for 2FA App Project',
    text: `Please verify your email by visiting: ${url}\nThis link expires in 24 hours.`,
    html: `
      <p>Click <a href="${url}">here</a> to verify your email.</p>
      <p>This link expires in 24 hours.</p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"2FA App Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password for 2FA App Project',
    text: `You requested a password reset. Please visit: ${resetUrl}\nThis link expires in 1 hour. If you didn't request this reset, please ignore this email.`,
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset for your Google 2FA App account.</p>
      <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email or contact support if you're concerned.</p>
    `,
  })
}
