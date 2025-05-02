import { create } from 'zustand';
import axios from 'axios';

export interface WorkflowTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  tags: WorkflowTag[];
}

export interface WorkflowsResponse {
  data: Workflow[];
  nextCursor: string | null;
}

interface WorkflowStore {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
  fetchWorkflows: () => Promise<void>;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflows: [],
  isLoading: false,
  error: null,
  
  fetchWorkflows: async () => {
    try {
      set({ isLoading: true, error: null });
      
      console.log('Fetching workflows...');
      try {
        // First try to get cached workflows from the proper API endpoint
        const response = await axios.get<WorkflowsResponse>('/api/v1/workflows/cached');
        
        if (response.status === 200 && response.data && response.data.data) {
          // Sort workflows alphabetically by name
          const sortedWorkflows = response.data.data.sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          
          set({ 
            workflows: sortedWorkflows,
            isLoading: false 
          });
          
          console.log(`Successfully fetched ${sortedWorkflows.length} workflows from cache`);
          return;
        }
      } catch (apiError) {
        console.error('Error fetching workflows from cached API:', apiError);
      }
      
      // If the first attempt fails, try the main workflows endpoint
      try {
        // Call the regular workflows endpoint which will create the cache if it doesn't exist
        const response = await axios.get<WorkflowsResponse>('/api/v1/workflows');
        
        // Sort workflows alphabetically by name
        const sortedWorkflows = response.data.data ? response.data.data.sort((a, b) => 
          a.name.localeCompare(b.name)
        ) : [];
        
        set({ 
          workflows: sortedWorkflows,
          isLoading: false 
        });
        
        console.log(`Successfully fetched ${sortedWorkflows.length} workflows from n8n API`);
      } catch (fallbackError) {
        console.error('Fallback error fetching workflows:', fallbackError);
        set({
          error: "Failed to fetch workflows. Please try again later.",
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error in workflow fetch process:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred while fetching workflows',
        isLoading: false 
      });
    }
  },
}));