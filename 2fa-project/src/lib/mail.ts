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

export async function sendAccountLockoutEmail(to: string, lockoutMinutes: number) {
  const resetPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password`
  
  await transporter.sendMail({
    from: `"2FA App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Account Security Alert: Temporary Account Lockout',
    text: `Your 2FA App account has been temporarily locked due to multiple failed login attempts. The account will be locked for ${lockoutMinutes} minutes. If this wasn't you, we recommend resetting your password immediately at ${resetPasswordUrl} or contacting our support team.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Security Alert</title>
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
          .alert-icon {
            text-align: center;
            margin-bottom: 20px;
            font-size: 48px;
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
            background-color: #ffebee;
            border-left: 4px solid #f44336;
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
          <div class="alert-icon">⚠️</div>
          <h1 style="color: #d32f2f; font-size: 24px; text-align: center;">Account Security Alert</h1>
          <p>Hello,</p>
          <p>We've detected multiple failed login attempts to your 2FA App account. As a security precaution, your account has been temporarily locked for <strong>${lockoutMinutes} minutes</strong>.</p>
          <div class="security-note">
            <p><strong>Important:</strong> If you were not attempting to log in, someone else may be trying to access your account. We recommend taking the following actions immediately:</p>
            <ol>
              <li>Reset your password</li>
              <li>Check for any unauthorized activity on your account</li>
              <li>Contact our support team if you need assistance</li>
            </ol>
          </div>
          <div class="button-container">
            <a href="${resetPasswordUrl}" class="button">Reset Your Password</a>
          </div>
          <p>After the lockout period expires, you'll be able to access your account again. If you need immediate assistance, please contact our support team.</p>
          <p>Best regards,<br>The 2FA App Security Team</p>
          <div class="footer">
            <p>© 2025 2FA App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordResetSuccessEmail(to: string) {
  await transporter.sendMail({
    from: `"2FA App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Reset Successful',
    text: `Your password has been successfully reset. If you did not make this change, please contact our support team immediately.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
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
          .success-icon {
            text-align: center;
            margin-bottom: 20px;
            font-size: 48px;
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
            background-color: #e8f5e8;
            border-left: 4px solid #4caf50;
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
          <div class="success-icon">✅</div>
          <h1 style="color: #4caf50; font-size: 24px; text-align: center;">Password Reset Successful</h1>
          <p>Hello,</p>
          <p>Your password has been successfully reset for your 2FA App account.</p>
          <div class="security-note">
            <p><strong>Security Information:</strong></p>
            <ul>
              <li>Your password was reset on ${new Date().toLocaleString()}</li>
              <li>If you have 2FA enabled, your trusted devices have been cleared for security</li>
              <li>You can now log in with your new password</li>
            </ul>
          </div>
          <p><strong>Important:</strong> If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
          <div class="button-container">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Log In to Your Account</a>
          </div>
          <p>Thank you for keeping your account secure.</p>
          <p>Best regards,<br>The 2FA App Security Team</p>
          <div class="footer">
            <p>© 2025 2FA App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

export async function sendPasswordChangeSuccessEmail(to: string) {
  await transporter.sendMail({
    from: `"2FA App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Password Changed Successfully',
    text: `Your password has been successfully changed. If you did not make this change, please contact our support team immediately.`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed Successfully</title>
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
          .success-icon {
            text-align: center;
            margin-bottom: 20px;
            font-size: 48px;
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
            background-color: #e8f5e8;
            border-left: 4px solid #4caf50;
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
          <div class="success-icon">✅</div>
          <h1 style="color: #4caf50; font-size: 24px; text-align: center;">Password Changed Successfully</h1>
          <p>Hello,</p>
          <p>Your password has been successfully changed for your 2FA App account.</p>
          <div class="security-note">
            <p><strong>Security Information:</strong></p>
            <ul>
              <li>Your password was changed on ${new Date().toLocaleString()}</li>
              <li>If you have 2FA enabled, your trusted devices have been cleared for security</li>
              <li>Your account remains secure with your new password</li>
            </ul>
          </div>
          <p><strong>Important:</strong> If you did not make this change, please contact our support team immediately as your account may have been compromised.</p>
          <div class="button-container">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
          </div>
          <p>Thank you for keeping your account secure.</p>
          <p>Best regards,<br>The 2FA App Security Team</p>
          <div class="footer">
            <p>© 2025 2FA App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
