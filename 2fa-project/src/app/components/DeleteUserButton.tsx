'use client'

import React, { useState } from 'react'

export default function DeleteUserButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const isDeleteEnabled = confirmText.toLowerCase() === 'delete'
  
  async function handleDeleteAccount() {
    try {
      setIsDeleting(true)
      setError('')
      
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        window.location.href = '/login';
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Account deletion failed:', error);
      setError('An unexpected error occurred');
      setIsDeleting(false);
    }
  }
  
  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center"
        aria-label="Delete Account"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Account
      </button>
      
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 rounded-lg max-w-md w-full shadow-xl">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="bg-red-600 p-2 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Delete Account</h3>
              </div>
              
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="font-bold text-red-500">delete</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full bg-secondary-900 border border-secondary-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="delete"
                  autoComplete="off"
                  autoFocus
                />
                {confirmText && !isDeleteEnabled && (
                  <p className="text-xs mt-1 text-red-400">
                    Please type &quot;delete&quot; exactly as shown to continue
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-900/30 p-3 rounded mb-4 text-red-300 border border-red-700">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmOpen(false)
                    setConfirmText('')
                  }}
                  className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white flex-1 py-2 rounded-md"
                  disabled={isDeleting}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className={`flex items-center justify-center text-white flex-1 py-2 rounded-md ${
                    isDeleteEnabled 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-red-900/50 cursor-not-allowed'
                  }`}
                  disabled={!isDeleteEnabled || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 