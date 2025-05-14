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
    from: process.env.EMAIL_USER,
    to,
    subject: 'Verify your email for Google 2FA App',
    text: `Please verify your email by visiting: ${url}\nThis link expires in 24 hours.`,
    html: `
      <p>Click <a href="${url}">here</a> to verify your email.</p>
      <p>This link expires in 24 hours.</p>
    `,
  })
}
