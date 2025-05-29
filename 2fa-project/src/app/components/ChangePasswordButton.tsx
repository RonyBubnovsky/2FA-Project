'use client'

import React, { useState } from 'react'
import ChangePasswordModal from './ChangePasswordModal'

export default function ChangePasswordButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-primary-600 hover:bg-primary-500 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center text-sm whitespace-nowrap"
        aria-label="Change Password"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
        Change Password
      </button>
      
      {isModalOpen && (
        <ChangePasswordModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
} 