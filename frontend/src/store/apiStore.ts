import { create } from 'zustand';
import { fetchHealthStatus } from '../api/healthApi';

interface ApiState {
  apiStatus: string | null;
  apiVersion: string | null;
  apiUptime: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchApiHealth: () => Promise<void>;
}

export const useApiStore = create<ApiState>((set) => ({
  apiStatus: null,
  apiVersion: null,
  apiUptime: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  fetchApiHealth: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const healthData = await fetchHealthStatus();
      
      set({
        apiStatus: healthData.status,
        apiVersion: healthData.version,
        apiUptime: healthData.uptime,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error fetching API health:', error);
      
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch API health',
        isLoading: false,
        lastUpdated: new Date()
      });
    }
  }
}));
