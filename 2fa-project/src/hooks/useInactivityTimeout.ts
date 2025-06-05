import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export default function useInactivityTimeout(enabled: boolean = true) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use useCallback to prevent recreation of this function on each render
  const resetTimer = useCallback(() => {
    if (!enabled || isLoggingOut) return;
    
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set new timer
    timerRef.current = setTimeout(async () => {
      // Prevent multiple logout calls
      if (isLoggingOut) return;
      
      setIsLoggingOut(true);
      
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Redirect to home page regardless of the API's redirectUrl
          router.push('/');
        } else {
          console.error('Failed to logout due to inactivity');
          // Reset the logging out state in case of failure
          setIsLoggingOut(false);
        }
      } catch (error) {
        console.error('Error during inactivity logout:', error);
        // Reset the logging out state in case of error
        setIsLoggingOut(false);
      }
    }, INACTIVITY_TIMEOUT);
  }, [enabled, router, isLoggingOut]); // Remove timer from dependencies

  useEffect(() => {
    if (!enabled || isLoggingOut) return;

    // Events to listen for
    const events = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click', 'keydown'
    ];

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Clean up event listeners and timer
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, resetTimer, isLoggingOut]); // Remove timer from dependencies
} 