import { create } from 'zustand';
import { fetchA2AStatus } from '../api/a2aApi';
import type { AgentCard } from '../api/a2aApi';

interface A2AState {
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  isLoading: boolean;
  error: string | null;
  agents: AgentCard[];
  lastChecked: string;
  fetchStatus: () => Promise<void>;
}

export const useA2AStore = create<A2AState>((set) => ({
  status: 'unknown',
  isLoading: false,
  error: null,
  agents: [],
  lastChecked: '',
  
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await fetchA2AStatus();
      set({ 
        status: data.status, 
        agents: data.agents,
        lastChecked: new Date().toISOString(),
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching A2A status:', error);
      set({ 
        status: 'down', 
        error: error instanceof Error ? error.message : String(error),
        isLoading: false
      });
    }
  }
}));