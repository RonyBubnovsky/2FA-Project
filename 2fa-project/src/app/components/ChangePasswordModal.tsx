'use client'

import React, { useState } from 'react'
import PasswordStrengthMeter from './PasswordStrengthMeter'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const handlePasswordStrengthChange = (strength: number) => {
    setPasswordStrength(strength)
  }
  
  const validateForm = () => {
    // Reset errors
    setError('')
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return false
    }
    
    // Check password strength
    if (passwordStrength < 5) {
      setError('Your password must include uppercase letters, lowercase letters, numbers, special characters, and be at least 8 characters long')
      return false
    }
    
    // Check if new password is different from current
    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return false
    }
    
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-secondary-800 dark:bg-secondary-900 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Password Changed Successfully</h3>
            <p className="text-secondary-300 mb-6">
              Your password has been updated. For security reasons, you&#39;ll be required to use your new password for future logins.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary py-2 px-4"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Change Password</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-secondary-400 hover:text-white focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-secondary-300 mb-6">
              Ensure your account stays secure by using a strong, unique password.
              Your new password must be different from your last 5 passwords.
            </p>
            
            {error && (
              <div className="p-3 rounded-md bg-red-900/20 border border-red-800/40 text-red-400 mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-secondary-300 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-secondary-300 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <PasswordStrengthMeter 
                  password={newPassword} 
                  onChange={handlePasswordStrengthChange}
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-secondary-900 border ${
                    confirmPassword && newPassword !== confirmPassword 
                      ? 'border-red-500' 
                      : 'border-secondary-700'
                  } rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500`}
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 ${
                    isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword
                      ? 'bg-primary-700/50 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-500'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating Password...
                    </span>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
} 