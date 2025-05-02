/**
 * MCP Server SSE API
 * Handles Server-Sent Events connection to the MCP Server
 */

import { create } from 'zustand';

export interface SSEConnectionState {
  isConnected: boolean;
  lastPing: string | null;
  connect: () => void;
  disconnect: () => void;
  updateLastPing: (timestamp: string) => void;
}

export const useSseConnection = create<SSEConnectionState>((set) => ({
  isConnected: false,
  lastPing: null,
  connect: () => set({ isConnected: true }),
  disconnect: () => set({ isConnected: false }),
  updateLastPing: (timestamp: string) => set({ lastPing: timestamp })
}));

let eventSource: EventSource | null = null;

export const connectToSSE = () => {
  if (eventSource) {
    eventSource.close();
  }

  try {
    console.log('Connecting to MCP SSE endpoint...');
    eventSource = new EventSource('/sse');
    const { connect, disconnect, updateLastPing } = useSseConnection.getState();

    eventSource.onopen = () => {
      console.log('SSE connection established');
      connect();
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      disconnect();
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
          connectToSSE();
        }
      }, 5000);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE event received:', data);

        if (data.type === 'ping') {
          updateLastPing(data.timestamp);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
  } catch (error) {
    console.error('Failed to connect to SSE endpoint:', error);
    useSseConnection.getState().disconnect();
  }

  return () => {
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