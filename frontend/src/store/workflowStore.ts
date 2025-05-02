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
      
      // Using a dummy dataset for now to unblock UI development
      const dummyData = {
        data: [
          {
            id: "demo-workflow-1",
            name: "Data Processing Workflow",
            active: true,
            tags: [
              {
                id: "tag-1",
                name: "data-processing",
                createdAt: "2025-05-01T00:00:00Z",
                updatedAt: "2025-05-01T12:00:00Z"
              }
            ]
          },
          {
            id: "demo-workflow-2",
            name: "Email Notification Workflow",
            active: false,
            tags: [
              {
                id: "tag-2",
                name: "notification",
                createdAt: "2025-05-01T00:00:00Z",
                updatedAt: "2025-05-01T12:00:00Z"
              }
            ]
          }
        ],
        nextCursor: null
      };
      
      // Sort workflows alphabetically by name
      const sortedWorkflows = dummyData.data.sort((a, b) => 
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