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
    - Account lockout with escalating timeouts (5, 10, 15 minutes, etc.)
    - Automatic reset of failed attempts after 15 minutes of inactivity
    - Email notifications for account lockouts with security recommendations
  - Session management with secure cookies
  - Rate limiting to prevent abuse
  - Trusted device management
  - Device recognition system to reduce 2FA prompts
  - Google reCAPTCHA protection during registration
  - Automatic logout after 15 minutes of inactivity on protected routes for enhanced security
  - Client-side activity monitoring to prevent unauthorized access on unattended devices

- **User Dashboard**

  - Manage 2FA settings
  - View account details
  - Change password with password history enforcement (prevents reuse of last 5 passwords)
  - Take the 2FA Security Quiz

- **2FA Security Quiz**
  - Interactive educational quiz with 10 questions about 2FA security
  - Accessible only to users with 2FA enabled
  - Responsive design for all devices
  - Educational content to increase security awareness
  - Modern UI with question progress tracking

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
   git clone https://github.com/RonyBubnovsky/2FA-Project.git
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

   # Recovery Code secret for additional encryption - Generate a secure random string
   RECOVERY_CODE_SECRET=

   # Secret key for encrypting 2FA secrets (64-character hex string)
   # Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   SECRET_ENCRYPTION_KEY=

   # Google reCAPTCHA v2 keys for bot protection
   # Get these from https://www.google.com/recaptcha/admin/
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
   RECAPTCHA_SECRET_KEY=
   ```

   To generate the SECRET_ENCRYPTION_KEY, run this command in your terminal:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the 64-character output and paste it as your SECRET_ENCRYPTION_KEY value.

   To obtain your reCAPTCHA keys:

   1. Go to the [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin/)
   2. Sign in with your Google account
   3. Click "Create" button to add a new site
   4. Choose reCAPTCHA v2 ("I'm not a robot" Checkbox)
   5. Add your domain (use "localhost" for local development)
   6. Accept the terms of service and click "Submit"
   7. Copy the "Site key" as NEXT_PUBLIC_RECAPTCHA_SITE_KEY
   8. Copy the "Secret key" as RECAPTCHA_SECRET_KEY

4. Run the development server

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing and CI/CD Pipeline

This project includes comprehensive automated tests for all API endpoints, with a focus on:

- Authentication flows (registration, login, logout)
- Email verification
- Password reset functionality
- Two-factor authentication (setup, verification, disable)
- Session management

### Running Tests

To run all tests locally:

```bash
npm test
```

To run specific test files:

```bash
npm test -- src/tests/api/auth/2fa-verify-login.test.ts
```

### Continuous Integration

The project uses GitHub Actions for CI/CD with the following automated pipeline:

1. Code checkout
2. Node.js environment setup
3. Dependency installation
4. Linting
5. Automated tests
6. Build process
7. Deployment to Vercel (if all previous steps succeed)

This ensures that all code changes are verified for quality and functionality before deployment, maintaining high reliability standards.

## Deployment

This project is deployed on Vercel. Visit [https://2fa-project.vercel.app/](https://2fa-project.vercel.app/) to see it in action.

## Security Best Practices

This project implements several security best practices:

- Password hashing using bcrypt
- Protection against common vulnerabilities (XSS, CSRF)
- Secure session management
- Rate limiting for sensitive operations
- Time-based 2FA tokens with secure verification
- Encryption of 2FA secrets before storing in the database
- Trusted device tokens with 30-day expiration for enhanced user experience without compromising security
- Account lockout mechanism with escalating timeouts to prevent brute force attacks
- Email notifications for security events (account lockouts, password changes)
- Password history enforcement to prevent password reuse
- Automatic session termination after 15 minutes of inactivity on protected routes to prevent unauthorized access

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to the Software Security course instructors for guidance
- [Next.js](https://nextjs.org/) - The React framework for production
- [Vercel](https://vercel.com/) - For hosting the application
- [MongoDB](https://www.mongodb.com/) - For database services
