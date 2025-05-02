import { create } from 'zustand';
import { fetchA2AStatus, fetchAgents, AgentCard } from '../api/a2aApi';

interface A2AStore {
  status: 'operational' | 'error' | 'unknown';
  agents: AgentCard[];
  isLoading: boolean;
  error: string | null;
  fetchA2AStatus: () => Promise<void>;
  fetchAgents: () => Promise<void>;
}

export const useA2AStore = create<A2AStore>((set) => ({
  status: 'unknown',
  agents: [],
  isLoading: false,
  error: null,
  
  fetchA2AStatus: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await fetchA2AStatus();
      
      set({
        status: 'operational',
        isLoading: false
      });
    } catch (error) {
      console.error('Error in fetchA2AStatus:', error);
      
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch A2A status',
        isLoading: false
      });
    }
  },
  
  fetchAgents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const agents = await fetchAgents();
      
      set({
        agents,
        status: 'operational',
        isLoading: false
      });
    } catch (error) {
      console.error('Error in fetchAgents:', error);
      
      set({
        agents: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch agents',
        isLoading: false
      });
    }
  }
}));