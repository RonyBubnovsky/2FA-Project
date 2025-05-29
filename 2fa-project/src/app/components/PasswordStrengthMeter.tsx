'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PasswordCriteria {
  regex: RegExp
  label: string
}

interface PasswordStrengthMeterProps {
  password: string
  onChange?: (strength: number) => void
}

export const PasswordStrengthMeter = ({ password, onChange }: PasswordStrengthMeterProps) => {
  const [strength, setStrength] = useState(0)
  const [showCriteria, setShowCriteria] = useState(false)
  const [allCriteriaMet, setAllCriteriaMet] = useState(false)

  // Wrap criteria in useMemo to avoid recreating on every render
  const criteria: PasswordCriteria[] = useMemo(() => [
    { regex: /.{8,}/, label: 'At least 8 characters' },
    { regex: /[A-Z]/, label: 'Uppercase letter' },
    { regex: /[a-z]/, label: 'Lowercase letter' },
    { regex: /[0-9]/, label: 'Number' },
    { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, label: 'Special character' }
  ], [])

  useEffect(() => {
    // Calculate password strength based on criteria
    if (!password) {
      setStrength(0)
      setAllCriteriaMet(false)
      onChange?.(0)
      return
    }

    const passedCriteriaCount = criteria.filter(c => c.regex.test(password)).length
    setStrength(passedCriteriaCount)
    
    // Check if all criteria are met
    setAllCriteriaMet(passedCriteriaCount === criteria.length)
    
    // Notify parent component of strength changes
    onChange?.(passedCriteriaCount)
  }, [password, criteria, onChange])

  // If password is entered, auto-show criteria until all are met
  useEffect(() => {
    if (password && !allCriteriaMet) {
      setShowCriteria(true)
    } else if (allCriteriaMet) {
      // Auto-hide criteria when all requirements are met
      setShowCriteria(false)
    }
  }, [password, allCriteriaMet])

  const toggleCriteria = () => {
    setShowCriteria(prev => !prev)
  }

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return 'Very Weak'
    if (strength === 1) return 'Weak'
    if (strength === 2) return 'Fair'
    if (strength === 3) return 'Good'
    if (strength === 4) return 'Strong'
    if (strength === 5) return 'Very Strong'
    return ''
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return 'rgb(239, 68, 68)' // red-500
    if (strength === 1) return 'rgb(239, 68, 68)' // red-500
    if (strength === 2) return 'rgb(249, 115, 22)' // orange-500
    if (strength === 3) return 'rgb(234, 179, 8)' // yellow-500
    if (strength === 4) return 'rgb(34, 197, 94)' // green-500
    if (strength === 5) return 'rgb(22, 163, 74)' // green-600
    return ''
  }

  return (
    <div className="mt-1 mb-3">
      {/* Interactive password strength bar */}
      <div className="flex flex-col space-y-2 relative">
        <div className="flex h-2 w-full rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              className={`h-full w-1/5 transition-colors duration-150 ease-out`}
              initial={{ opacity: 0.5, scaleX: 0.95 }}
              animate={{ 
                opacity: level <= strength ? 1 : 0.5,
                scaleX: level <= strength ? 1 : 0.95,
                backgroundColor: level <= strength ? getStrengthColor(strength) : 'rgb(229, 231, 235)' 
              }}
              transition={{ 
                duration: 0.15,
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          ))}
        </div>

        {/* Strength label with animation */}
        {password && (
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs text-secondary-600 dark:text-secondary-400">
              Password strength: 
              <span 
                className="ml-1 font-medium"
                style={{ color: getStrengthColor(strength) }}
              >
                {getStrengthLabel(strength)}
              </span>
            </p>
            
            {/* Only show toggle button if we have a password */}
            {password && (
              <button 
                type="button"
                onClick={toggleCriteria}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline focus:outline-none"
              >
                {showCriteria ? 'Hide tips' : 'Show tips'}
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Expandable criteria checklist - show when button is clicked or when password exists but not all criteria are met */}
      <AnimatePresence>
        {showCriteria && password && (
          <motion.div 
            className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-md border border-secondary-200 dark:border-secondary-700"
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-xs font-medium mb-2 text-secondary-700 dark:text-secondary-300">
              For a strong password, include:
            </p>
            <ul className="space-y-1.5">
              {criteria.map((criterion, index) => {
                const isMet = criterion.regex.test(password)
                return (
                  <li key={index} className="flex items-center text-xs">
                    <span 
                      className={`flex-shrink-0 h-4 w-4 mr-2 rounded-full flex items-center justify-center ${
                        isMet ? 'bg-green-100 dark:bg-green-900/30' : 'bg-secondary-100 dark:bg-secondary-800'
                      }`}
                    >
                      {isMet ? (
                        <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-3 w-3 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <span className={isMet ? 'text-secondary-700 dark:text-secondary-300' : 'text-secondary-500 dark:text-secondary-400'}>
                      {criterion.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive password suggestion */}
      {password && strength < 3 && (
        <motion.div
          className="mt-3 text-xs"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="flex items-center text-blue-600 dark:text-blue-400">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try a passphrase - a combination of random words is often stronger and easier to remember
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default PasswordStrengthMeter 