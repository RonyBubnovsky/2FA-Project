'use client'

export default function LogoutButton() {
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
  
  return (
    <button
      onClick={handleLogout}
      className="btn btn-outline px-4 py-2"
    >
      Sign out
    </button>
  );
} 