'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReCAPTCHA from 'react-google-recaptcha'

// Password strength component
function PasswordStrengthMeter({ password }: { password: string }) {
  // Calculate password strength
  const calculateStrength = (password: string) => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    
    return score;
  };
  
  const strength = calculateStrength(password);
  
  // Strength indicators
  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    if (strength === 4) return 'Strong';
    if (strength === 5) return 'Very Strong';
    return '';
  };
  
  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'bg-red-500';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    if (strength === 4) return 'bg-green-500';
    if (strength === 5) return 'bg-green-600';
    return '';
  };
  
  return (
    <div className="mt-1 mb-3">
      <div className="flex h-1 w-full rounded bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full w-1/5 ${level <= strength ? getStrengthColor(strength) : 'bg-secondary-200 dark:bg-secondary-700'}`}
          />
        ))}
      </div>
      {password && (
        <p className="text-xs mt-1 text-secondary-600 dark:text-secondary-400">
          Password strength: <span className="font-medium">{getStrengthLabel(strength)}</span>
        </p>
      )}
      {password && strength < 3 && (
        <p className="text-xs text-red-500 mt-1">
          Use at least 8 characters with uppercase, lowercase, numbers and special characters.
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const router = useRouter()
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    confirmPassword?: string;
    captcha?: string;
  }>({})
  
  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        // Use a dedicated API endpoint to check auth status
        const res = await fetch('/api/auth/status')
        const data = await res.json()
        
        if (data.authenticated) {
          router.replace('/dashboard')
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAuth()
  }, [router])
  
  // Validate email with regex
  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }
  
  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }
  
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters and spaces
    if (value === '' || /^[a-zA-Z\s]+$/.test(value)) {
      setFirstName(value);
      // Clear validation error if it exists
      if (validationErrors.firstName) {
        setValidationErrors({...validationErrors, firstName: undefined});
      }
    } else {
      setValidationErrors({...validationErrors, firstName: 'First name should contain only letters'});
    }
  }

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow letters and spaces
    if (value === '' || /^[a-zA-Z\s]+$/.test(value)) {
      setLastName(value);
      // Clear validation error if it exists
      if (validationErrors.lastName) {
        setValidationErrors({...validationErrors, lastName: undefined});
      }
    } else {
      setValidationErrors({...validationErrors, lastName: 'Last name should contain only letters'});
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    // Check if passwords match and clear error if they do
    if (password === value) {
      setValidationErrors({...validationErrors, confirmPassword: undefined});
    } else if (value) { // Only show error if user has typed something
      setValidationErrors({...validationErrors, confirmPassword: 'Passwords do not match'});
    }
  }

  // Also update password change to check confirmPassword match
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Check if confirm password has been entered and if they match
    if (confirmPassword) {
      if (value === confirmPassword) {
        setValidationErrors({...validationErrors, confirmPassword: undefined});
      } else {
        setValidationErrors({...validationErrors, confirmPassword: 'Passwords do not match'});
      }
    }
  }

  // Form validation
  const validateForm = () => {
    const errors: {
      email?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      confirmPassword?: string;
      captcha?: string;
    } = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Name validations
    if (!firstName) {
      errors.firstName = 'First name is required';
    }
    
    if (!lastName) {
      errors.lastName = 'Last name is required';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      errors.password = 'Password is too weak';
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // CAPTCHA validation
    if (!captchaToken) {
      errors.captcha = 'Please complete the CAPTCHA verification';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Handle CAPTCHA completion
  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    
    // Clear captcha error if present
    if (token && validationErrors.captcha) {
      setValidationErrors(prev => ({ ...prev, captcha: undefined }));
    }
  }

  // Reset CAPTCHA on error
  const resetCaptcha = () => {
    setCaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Clear previous messages
    setMessage('')
    setError('')
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          firstName, 
          lastName, 
          password,
          captchaToken // Include captcha token for server-side verification
        }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage('Check your email / spam folder for verification link.')
        // Clear form on success
        setEmail('')
        setFirstName('')
        setLastName('')
        setPassword('')
        setConfirmPassword('')
        resetCaptcha()
      } else {
        setError(data.error)
        // Reset CAPTCHA on failure for security
        resetCaptcha()
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error(error)
      // Reset CAPTCHA on any error
      resetCaptcha()
    } finally {
      setIsLoading(false)
    }
  }

  // Add loading state at the top of the return statement
  if (isChecking) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
          <div className="h-2 w-2 bg-primary-300 dark:bg-primary-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-display font-bold text-secondary-900 dark:text-secondary-100">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
              Get started with secure two-factor authentication
            </p>
          </div>
          
          {message && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/10 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`input ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  placeholder="John"
                  value={firstName}
                  onChange={handleFirstNameChange}
                  className={`input ${validationErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={lastName}
                  onChange={handleLastNameChange}
                  className={`input ${validationErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                className={`input ${validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              <PasswordStrengthMeter password={password} />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`input ${validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                required
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
            
            <div className="flex justify-center mt-4">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={handleCaptchaChange}
              />
            </div>
            {validationErrors.captcha && (
              <p className="mt-1 text-sm text-red-600 text-center">{validationErrors.captcha}</p>
            )}
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200 dark:border-secondary-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-secondary-500 dark:bg-secondary-900 dark:text-secondary-400">
                  Already have an account?
                </span>
              </div>
            </div>
            <div className="mt-6">
              <a href="/login" className="btn btn-outline w-full py-3 hover:text-white">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
