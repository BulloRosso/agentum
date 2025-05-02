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
      const response = await axios.get<WorkflowsResponse>('/api/v1/workflows/cached');
      
      // Sort workflows alphabetically by name
      const sortedWorkflows = response.data.data.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      set({ 
        workflows: sortedWorkflows,
        isLoading: false 
      });
      
      console.log(`Successfully fetched ${sortedWorkflows.length} workflows`);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred while fetching workflows',
        isLoading: false 
      });
    }
  },
}));