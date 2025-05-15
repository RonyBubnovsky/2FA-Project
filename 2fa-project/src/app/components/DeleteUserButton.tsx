'use client'

import React, { useState } from 'react'

export default function DeleteUserButton() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  
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
        className="btn btn-outline-danger px-4 py-2"
        aria-label="Delete Account"
      >
        Delete Account
      </button>
      
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-secondary-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
              Delete Account
            </h3>
            <p className="text-secondary-700 dark:text-secondary-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </p>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded mb-4 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="btn btn-secondary flex-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn btn-danger flex-1"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 