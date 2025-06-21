import { NextApiRequest, NextApiResponse } from 'next'
import { transporter } from '../../../lib/mail'
import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter configuration: 5 requests per hour (3600 seconds)
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'contact_form',
  points: 5, // Number of requests
  duration: 3600, // Per 3600 seconds (1 hour)
  blockDuration: 3600, // Block for 1 hour if limit exceeded
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    // Get client IP
    const forwarded = req.headers['x-forwarded-for'] as string
    const ip = forwarded ? forwarded.split(',')[0] : (req.headers['x-real-ip'] as string) || req.connection?.remoteAddress || 'unknown'    // Apply rate limiting - 5 contact form submissions per hour per IP
    try {
      await rateLimiter.consume(ip)
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      const remainingTime = rateLimiterRes && typeof rateLimiterRes === 'object' && 'msBeforeNext' in rateLimiterRes
        ? Math.round((rateLimiterRes as { msBeforeNext: number }).msBeforeNext / 1000) 
        : 3600
      return res.status(429).json({
        error: 'Too many contact form submissions. Please try again later.',
        remainingTime: remainingTime
      })
    }

    const { name, email, subject, message } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate message length
    if (message.length < 10 || message.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 10 and 2000 characters' })
    }

    // Send email notification to admin
    await transporter.sendMail({
      from: `"2FA App Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      replyTo: email,
      text: `
New contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent via the 2FA App contact form.
Reply directly to this email to respond to the user.
      `,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Submission</title>
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
              padding-bottom: 20px;
              border-bottom: 2px solid #1a53ff;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #1a53ff;
            }
            .field {
              margin-bottom: 20px;
              padding: 15px;
              background-color: white;
              border-radius: 6px;
              border-left: 4px solid #1a53ff;
            }
            .field-label {
              font-weight: bold;
              color: #1a53ff;
              margin-bottom: 5px;
            }
            .field-value {
              color: #333;
              word-wrap: break-word;
            }
            .message-field {
              background-color: #fff8e6;
              border-left-color: #ffbb00;
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
              <div class="logo">2FA App - Contact Form</div>
            </div>
            
            <h1 style="color: #1a53ff; font-size: 20px; margin-bottom: 25px;">New Contact Form Submission</h1>
            
            <div class="field">
              <div class="field-label">Name:</div>
              <div class="field-value">${name}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value"><a href="mailto:${email}" style="color: #1a53ff;">${email}</a></div>
            </div>
            
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            
            <div class="field message-field">
              <div class="field-label">Message:</div>
              <div class="field-value" style="white-space: pre-wrap;">${message}</div>
            </div>
            
            <div class="footer">
              <p><strong>Reply Instructions:</strong> You can reply directly to this email to respond to the user.</p>
              <p>© 2025 2FA App. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    // Send confirmation email to user
    await transporter.sendMail({
      from: `"2FA App Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting 2FA App',
      text: `
Hello ${name},

Thank you for contacting 2FA App. We have received your message regarding: ${subject}

We typically respond to inquiries within 24 hours. If your inquiry is urgent or security-related, please mention this in your message.

Your message:
${message}

Best regards,
The 2FA App Support Team

---
This is an automated confirmation email. Please do not reply to this message.
      `,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Confirmation</title>
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
            .message-summary {
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
            <h1 style="color: #4caf50; font-size: 24px; text-align: center;">Message Received</h1>
            <p>Hello ${name},</p>
            <p>Thank you for contacting 2FA App. We have successfully received your message and will respond within 24 hours.</p>
            
            <div class="message-summary">
              <p><strong>Your inquiry:</strong></p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap; font-style: italic;">${message}</p>
            </div>
            
            <p>If your inquiry is urgent or security-related, please mention this in any follow-up communications.</p>
            
            <div class="button-container">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>Best regards,<br>The 2FA App Support Team</p>
            <div class="footer">
              <p><em>This is an automated confirmation email. Please do not reply to this message.</em></p>
              <p>© 2025 2FA App. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return res.status(200).json({ 
      success: true,
      message: 'Message sent successfully' 
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return res.status(500).json({
      error: 'Failed to send message. Please try again later.'
    })
  }
}
