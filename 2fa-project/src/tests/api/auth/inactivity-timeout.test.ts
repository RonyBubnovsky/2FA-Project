// @ts-nocheck
/**
 * Tests for the inactivity timeout functionality
 */

// Setup DOM mocks for Node environment
class MockEventTarget {
  listeners = {};
  addEventListener(event, callback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  }
  removeEventListener(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }
  // Helper to trigger events for testing
  simulateEvent(event) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb());
  }
}

// Mock document and window
const mockDocument = new MockEventTarget();
const mockWindow = new MockEventTarget();

// Mock browser globals
global.document = mockDocument;
global.window = mockWindow;

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Import the hook code but mock its React dependencies
import { useState, useEffect, useCallback, useRef } from 'react';

// Mock React hooks
jest.mock('react', () => {
  const originalModule = jest.requireActual('react');
  
  // Mock useState
  const mockState = {};
  const mockSetState = jest.fn();
  const mockUseState = jest.fn((initialValue) => {
    return [initialValue, mockSetState];
  });
  
  // Mock useRef
  const mockRef = { current: null };
  const mockUseRef = jest.fn((initialValue) => {
    mockRef.current = initialValue;
    return mockRef;
  });
  
  // Mock useEffect - execute the function immediately
  const mockUseEffect = jest.fn((callback, deps) => {
    const cleanup = callback();
    return cleanup;
  });
  
  // Mock useCallback - just return the callback
  const mockUseCallback = jest.fn((callback, deps) => callback);
  
  return {
    ...originalModule,
    useState: mockUseState,
    useEffect: mockUseEffect,
    useCallback: mockUseCallback,
    useRef: mockUseRef,
  };
});

// Import after mocking
import useInactivityTimeout from '../../../hooks/useInactivityTimeout';

describe('Inactivity Timeout Hook', () => {
  let originalFetch;
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    // Save original fetch
    originalFetch = global.fetch;
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({ 
      ok: true, 
      json: async () => ({ ok: true }) 
    });
    
    // Reset mocks
    mockPush.mockClear();
    
    // Reset event listeners
    mockDocument.listeners = {};
    mockWindow.listeners = {};
  });
  
  afterEach(() => {
    // Restore original implementations
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  
  it('should call logout API and redirect after inactivity', async () => {
    // Directly call the hook function - this will trigger the useEffect
    useInactivityTimeout();
    
    // Fast-forward past the timeout
    jest.advanceTimersByTime(15*60*1000);
    
    // Run pending promises
    await Promise.resolve();
    
    // Verify logout API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST'
    }));
    
    // Verify redirect was called
    expect(mockPush).toHaveBeenCalledWith('/');
  });
  
  it('should reset timer when user interacts with the page', () => {
    // Call the hook
    useInactivityTimeout();
    
    // Get the number of active timers
    const initialTimers = jest.getTimerCount();
    
    // Fast-forward a bit but not enough to trigger timeout
    jest.advanceTimersByTime(15*60*500);
    
    // Simulate user activity by triggering one of the event listeners
    mockDocument.simulateEvent('mousemove');
    
    // Fast-forward past the original timeout time
    jest.advanceTimersByTime(15*60*500);
    
    // No API call should have been made yet
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Fast-forward past the reset timeout
    jest.advanceTimersByTime(15*60*500);
    
    // Now the API call should have been made
    expect(global.fetch).toHaveBeenCalled();
  });
  
  it('should not set timer when disabled', async () => {
    // Call the hook with disabled flag
    useInactivityTimeout(false);
    
    // Fast-forward past the timeout
    jest.advanceTimersByTime(15*60*1100);
    
    // Run pending promises
    await Promise.resolve();
    
    // No API call should have been made
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 