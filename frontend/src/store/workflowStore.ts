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
      
      console.log('Fetching workflows from n8n API...');
      // Always get fresh data from the n8n API endpoint
      const response = await axios.get<WorkflowsResponse>('/api/v1/workflows');
      
      if (response.status === 200 && response.data && response.data.data) {
        // Sort workflows alphabetically by name
        const sortedWorkflows = response.data.data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        set({ 
          workflows: sortedWorkflows,
          isLoading: false 
        });
        
        console.log(`Successfully fetched ${sortedWorkflows.length} workflows from n8n API`);
      } else {
        set({
          workflows: [],
          isLoading: false,
          error: "No workflows returned from API"
        });
      }
    } catch (error) {
      console.error('Error in workflow fetch process:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred while fetching workflows',
        isLoading: false,
        workflows: [] // Clear workflows on error
      });
    }
  },
}));