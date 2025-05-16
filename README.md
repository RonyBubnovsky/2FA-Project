# Two-Factor Authentication System

A secure and modern two-factor authentication (2FA) application built with Next.js and TypeScript. This project implements industry-standard security practices for protecting user accounts through multi-factor authentication.

![2FA Security](https://img.shields.io/badge/Security-2FA-green)
![Next.js](https://img.shields.io/badge/Built%20with-Next.js-black)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

**Live Demo:** [https://2fa-project.vercel.app/](https://2fa-project.vercel.app/)

**Note: When using Gmail SMTP service with Nodemailer, verification and password reset emails may be delivered to spam folders. Please check your spam folder if you don't receive expected emails during registration or password reset processes.**

## About

This project was developed as a final project for the Software Security course, demonstrating advanced security concepts in a practical web application. It provides a complete authentication system with two-factor authentication capabilities built using Next.js with TypeScript.

## Features

- **User Authentication**
  - Secure registration and login process
  - Email verification system
  - Password reset functionality
  - "Remember this device" functionality for 30 days
- **Two-Factor Authentication**
  - Time-based One-Time Password (TOTP) implementation
  - QR code generation for easy setup with authenticator apps
  - Recovery codes for backup access
- **Security Features**

  - Strong password enforcement
  - Protection against brute force attacks
  - Session management with secure cookies
  - Rate limiting to prevent abuse
  - Trusted device management
  - Device recognition system to reduce 2FA prompts

- **User Dashboard**
  - Manage 2FA settings
  - View account details
  - Regenerate recovery codes
  - Manage trusted devices

## Technology Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Authentication**: Iron Session, Speakeasy (for TOTP)
- **Email Services**: Nodemailer
- **Security**: bcryptjs, rate-limiter-flexible

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- MongoDB database

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/2FA-Project.git
   cd 2FA-Project
   ```

2. Install dependencies

   ```bash
   cd 2fa-project
   npm install
   ```

3. Create a `.env.local` file in the 2fa-project directory with the following variables:

   ```
   # MongoDB connection string - Create a free MongoDB Atlas cluster and get the connection string
   MONGODB_URI=

   # Session password - Generate a secure random string (min 32 characters)
   SESSION_PASSWORD=

   # URL for your local development
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Gmail account (full email address)
   EMAIL_USER=

   # Gmail app password (NOT your regular Gmail password)
   # Generate this in your Google Account > Security > App passwords
   EMAIL_PASS=

   # HMAC secret for additional encryption - Generate a secure random string
   HMAC_SECRET=
   ```

4. Run the development server

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project is deployed on Vercel. Visit [https://2fa-project.vercel.app/](https://2fa-project.vercel.app/) to see it in action.

## Security Best Practices

This project implements several security best practices:

- Password hashing using bcrypt
- Protection against common vulnerabilities (XSS, CSRF)
- Secure session management
- Rate limiting for sensitive operations
- Time-based 2FA tokens with secure verification
- Trusted device tokens with 30-day expiration for enhanced user experience without compromising security

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to the Software Security course instructors for guidance
- [Next.js](https://nextjs.org/) - The React framework for production
- [Vercel](https://vercel.com/) - For hosting the application
- [MongoDB](https://www.mongodb.com/) - For database services
