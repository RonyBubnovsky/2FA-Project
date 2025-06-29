'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { validateEmail } from '../../utils/validation'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  // Client-side validation function
  const validateForm = (): string | null => {
    // Check if all required fields are filled
    if (!formData.name.trim()) {
      return 'Full name is required'
    }
    
    if (!formData.email.trim()) {
      return 'Email address is required'
    }
    
    if (!formData.subject) {
      return 'Please select a subject'
    }
    
    if (!formData.message.trim()) {
      return 'Message is required'
    }

    // Validate email format
    if (!validateEmail(formData.email)) {
      return 'Please enter a valid email address'
    }

    // Validate message length
    if (formData.message.length < 10) {
      return 'Message must be at least 10 characters long'
    }
    
    if (formData.message.length > 2000) {
      return 'Message must be no more than 2000 characters'
    }

    // Validate name length (reasonable limits)
    if (formData.name.length < 2) {
      return 'Name must be at least 2 characters long'
    }
    
    if (formData.name.length > 100) {
      return 'Name must be no more than 100 characters'
    }

    return null // No validation errors
  }

  // Validate individual field
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required'
        if (value.length < 2) return 'Name must be at least 2 characters'
        if (value.length > 100) return 'Name must be no more than 100 characters'
        return ''
      
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!validateEmail(value)) return 'Please enter a valid email address'
        return ''
      
      case 'subject':
        if (!value) return 'Please select a subject'
        return ''
      
      case 'message':
        if (!value.trim()) return 'Message is required'
        if (value.length < 10) return 'Message must be at least 10 characters'
        if (value.length > 2000) return 'Message must be no more than 2000 characters'
        return ''
      
      default:
        return ''
    }
  }

  // Check if form is valid and ready to submit
  const isFormValid = (): boolean => {
    // Check if all required fields are filled
    const isAllFieldsFilled = !!(formData.name.trim() && 
                                 formData.email.trim() && 
                                 formData.subject && 
                                 formData.message.trim())
    
    // Check if there are no field errors
    const hasNoErrors = !fieldErrors.name && 
                        !fieldErrors.email && 
                        !fieldErrors.subject && 
                        !fieldErrors.message
    
    return isAllFieldsFilled && hasNoErrors
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)
    setErrorMessage('')

    // Client-side validation
    const validationError = validateForm()
    if (validationError) {
      setSubmitStatus('error')
      setErrorMessage(validationError)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/auth/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
        setFieldErrors({ name: '', email: '', subject: '', message: '' })
      } else {
        setSubmitStatus('error')
        if (response.status === 429) {
          // Rate limit error - show remaining time if available
          const remainingTime = data.remainingTime
          const timeText = remainingTime ? ` Try again in ${Math.ceil(remainingTime / 60)} minutes.` : ''
          setErrorMessage(`${data.error}${timeText}`)
        } else {
          setErrorMessage(data.error || 'Failed to send message. Please try again.')
        }
      }
    } catch {
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Clear success or error message when user starts typing again
    if (submitStatus !== null) {
      setSubmitStatus(null)
      setErrorMessage('')
    }
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time field validation
    const fieldError = validateField(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: fieldError
    }))
  }
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
              Have questions about our 2FA security features? Need technical support? 
              We&apos;re here to help you secure your applications.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-6">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white">Email</h3>
                      <p className="text-secondary-600 dark:text-secondary-400">
                        We&apos;ll respond within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white">Security</h3>
                      <p className="text-secondary-600 dark:text-secondary-400">
                        Report security issues or vulnerabilities
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-6">
                  Send us a Message
                </h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-green-700 dark:text-green-300">
                        Message sent successfully! We&apos;ll get back to you soon.
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-red-700 dark:text-red-300">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'} rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400`}
                        placeholder="Your full name"
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'} rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400`}
                        placeholder="your.email@example.com"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${fieldErrors.subject ? 'border-red-500 focus:ring-red-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'} rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white`}
                    >
                      <option value="">Select a subject</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="2fa-setup">2FA Setup Help</option>
                      <option value="security-issue">Security Issue</option>
                      <option value="account-issue">Account Issue</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="general-inquiry">General Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                    {fieldErrors.subject && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {fieldErrors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${fieldErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-secondary-300 dark:border-secondary-600 focus:ring-primary-500'} rounded-lg focus:ring-2 focus:border-transparent bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400 resize-none`}
                      placeholder="Please describe your inquiry in detail..."
                    />
                    {fieldErrors.message && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {fieldErrors.message}
                      </p>
                    )}
                    <div className="mt-1 text-sm text-secondary-500 dark:text-secondary-400 text-right">
                      {formData.message.length}/2000 characters
                    </div>
                  </div>

                  {!isFormValid() && !isSubmitting && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center text-amber-700 dark:text-amber-300">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">Please complete all required fields to send your message</span>                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || !isFormValid()}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-400 disabled:hover:bg-secondary-400 disabled:cursor-not-allowed disabled:text-secondary-600 disabled:opacity-60 disabled:shadow-none text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-900 dark:disabled:bg-secondary-700 dark:disabled:text-secondary-500 dark:disabled:hover:bg-secondary-700"
                      title={!isFormValid() && !isSubmitting ? 'Please fill all required fields correctly' : ''}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                    <Link
                      href="/"
                      className="flex-1 sm:flex-none border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-secondary-50 dark:hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-900 text-center"
                    >
                      Back to Home
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
  )
}
