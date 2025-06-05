'use client';
import { ReactNode } from 'react';
import useInactivityTimeout from '../../hooks/useInactivityTimeout';

interface InactivityMonitorProps {
  children: ReactNode;
  enabled?: boolean;
}

export default function InactivityMonitor({ children, enabled = true }: InactivityMonitorProps) {
  // Use our custom hook
  useInactivityTimeout(enabled);
  
  return <>{children}</>;
} 