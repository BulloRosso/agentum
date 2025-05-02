import { create } from 'zustand';
import { fetchHealthStatus, fetchApiMethods, APIMethod } from '../api/healthApi';

interface ApiState {
  apiStatus: string | null;
  apiVersion: string | null;
  apiUptime: number | null;
  apiMethods: APIMethod[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchApiHealth: () => Promise<void>;
  fetchApiMethods: () => Promise<void>;
}

export const useApiStore = create<ApiState>((set) => ({
  apiStatus: null,
  apiVersion: null,
  apiUptime: null,
  apiMethods: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  fetchApiHealth: async () => {
    console.log('Store: Starting API health fetch');
    set({ isLoading: true, error: null });
    
    try {
      console.log('Store: Calling fetchHealthStatus()');
      const healthData = await fetchHealthStatus();
      console.log('Store: Received health data:', healthData);
      
      set({
        apiStatus: healthData.status,
        apiVersion: healthData.version,
        apiUptime: healthData.uptime,
        isLoading: false,
        lastUpdated: new Date()
      });
      console.log('Store: Successfully updated state with health data');
    } catch (error) {
      console.error('Store: Error fetching API health:', error);
      
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch API health',
        isLoading: false,
        lastUpdated: new Date()
      });
      console.log('Store: Set error state');
    }
  },
  
  fetchApiMethods: async () => {
    console.log('Store: Starting API methods fetch');
    try {
      console.log('Store: Calling fetchApiMethods()');
      const methods = await fetchApiMethods();
      console.log('Store: Received API methods data:', methods);
      
      set({
        apiMethods: methods,
        lastUpdated: new Date()
      });
      console.log('Store: Successfully updated state with API methods data');
    } catch (error) {
      console.error('Store: Error fetching API methods:', error);
      // We don't set the error state for this one to avoid disrupting the main health check display
    }
  }
}));
