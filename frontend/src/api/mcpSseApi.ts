/**
 * MCP Server SSE API
 * Handles Server-Sent Events connection to the MCP Server
 */

import { create } from 'zustand';

export interface SSEConnectionState {
  isConnected: boolean;
  lastPing: string | null;
  connecting: boolean;
  connect: () => void;
  disconnect: () => void;
  setConnecting: () => void;
  updateLastPing: (timestamp: string) => void;
}

export const useSseConnection = create<SSEConnectionState>((set) => ({
  isConnected: false,
  connecting: false,
  lastPing: null,
  connect: () => set({ isConnected: true, connecting: false }),
  disconnect: () => set({ isConnected: false, connecting: false }),
  setConnecting: () => set({ isConnected: false, connecting: true }),
  updateLastPing: (timestamp: string) => set({ lastPing: timestamp })
}));

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds

export const connectToSSE = () => {
  // Clear any existing reconnect timers
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Close existing connection
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }

  try {
    console.log('Connecting to MCP SSE endpoint...');
    
    // Create a new EventSource with retry support
    eventSource = new EventSource('/sse', { withCredentials: false });
    const { connect, disconnect, updateLastPing, setConnecting } = useSseConnection.getState();
    
    // Set connecting state
    setConnecting();

    // Handle successful connection
    eventSource.onopen = () => {
      console.log('SSE connection established');
      connect();
      retryCount = 0; // Reset retry count on successful connection
    };

    // Handle connection errors with exponential backoff
    eventSource.onerror = (error) => {
      console.warn('SSE connection error:', error);
      
      // Only disconnect if we're currently connected
      if (useSseConnection.getState().isConnected) {
        disconnect();
      }
      
      // Close current connection
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      
      // Schedule reconnection attempt with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.min(RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
        console.log(`Scheduling SSE reconnection attempt in ${delay/1000} seconds`);
        
        // Set reconnecting state
        setConnecting();
        
        reconnectTimer = setTimeout(() => {
          retryCount++;
          connectToSSE();
        }, delay);
      } else {
        console.error(`Failed to establish SSE connection after ${MAX_RETRIES} attempts`);
        disconnect(); // Set final disconnected state
      }
    };

    // Handle messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE event received:', data);

        // Process ping events for connection health monitoring
        if (data.type === 'ping') {
          updateLastPing(data.timestamp);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
  } catch (error) {
    console.error('Failed to initialize SSE connection:', error);
    useSseConnection.getState().disconnect();
  }

  // Return cleanup function
  return () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    if (eventSource) {
      console.log('Closing SSE connection');
      eventSource.close();
      eventSource = null;
      useSseConnection.getState().disconnect();
    }
  };
};

export const disconnectFromSSE = () => {
  if (eventSource) {
    console.log('Manually closing SSE connection');
    eventSource.close();
    eventSource = null;
    useSseConnection.getState().disconnect();
  }
};