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
    from: `"2FA App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email address',
    text: `Please verify your email by visiting: ${url}\nThis link expires in 24 hours.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f7f9fc;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: 1px solid #e1e4e8;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1a53ff;
          }
          .button-container {
            text-align: center;
            margin: 25px 0;
          }
          .button {
            display: inline-block;
            background-color: #1a53ff;
            color: white !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #1a53ff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
            text-align: center;
            border-top: 1px solid #e1e4e8;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">2FA App</div>
          </div>
          <p>Hello,</p>
          <p>Thank you for registering with 2FA App. Please verify your email address to complete your account setup.</p>
          <div class="button-container">
            <a href="${url}" class="button">Verify Email Address</a>
          </div>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you did not create an account with us, please disregard this email.</p>
          <p>Best regards,<br>The 2FA App Team</p>
          <div class="footer">
            <p>© 2025 2FA App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"2FA App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password',
    text: `You requested a password reset. Please visit: ${resetUrl}\nThis link expires in 1 hour. If you didn't request this reset, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f7f9fc;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: 1px solid #e1e4e8;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1a53ff;
          }
          .button-container {
            text-align: center;
            margin: 25px 0;
          }
          .button {
            display: inline-block;
            background-color: #1a53ff;
            color: white !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #1a53ff;
            box-shadow: 0 3px 6px rgba(0,0,0,0.16);
          }
          .security-note {
            background-color: #fff8e6;
            border-left: 4px solid #ffbb00;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
            text-align: center;
            border-top: 1px solid #e1e4e8;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">2FA App</div>
          </div>
          <h1 style="color: #333; font-size: 24px; text-align: center;">Password Reset Request</h1>
          <p>Hello,</p>
          <p>We received a request to reset your password for your 2FA App account. To proceed with the password reset, click the button below:</p>
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <div class="security-note">
            <p><strong>Security Note:</strong> If you didn't request this password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>
          </div>
          <p>Best regards,<br>The 2FA App Team</p>
          <div class="footer">
            <p>© 2025 2FA App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
