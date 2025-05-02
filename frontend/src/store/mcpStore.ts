import { create } from 'zustand';
import { fetchMCPStatus, fetchMCPTools, fetchMCPResources, fetchMCPPrompts } from '../api/mcpApi';
import type { MCPStatus, MCPTool, MCPResource, MCPPrompt } from '../api/mcpApi';

interface MCPState {
  status: MCPStatus | null;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  isLoading: boolean;
  error: string | null;
  fetchStatus: () => Promise<void>;
  fetchTools: () => Promise<void>;
  fetchResources: () => Promise<void>;
  fetchPrompts: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useMCPStore = create<MCPState>((set, get) => ({
  status: null,
  tools: [],
  resources: [],
  prompts: [],
  isLoading: false,
  error: null,

  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Store: Calling fetchMCPStatus()');
      const status = await fetchMCPStatus();
      console.log('Store: Received MCP status data:', status);
      set({ status, isLoading: false });
      console.log('Store: Successfully updated state with MCP status data');
    } catch (error) {
      console.error('Store: Error fetching MCP status:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch MCP status', 
        isLoading: false 
      });
    }
  },

  fetchTools: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Store: Calling fetchMCPTools()');
      const tools = await fetchMCPTools();
      console.log('Store: Received MCP tools data:', tools);
      set({ tools, isLoading: false });
      console.log('Store: Successfully updated state with MCP tools data');
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch MCP tools', 
        isLoading: false,
        tools: [] 
      });
    }
  },

  fetchResources: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Store: Calling fetchMCPResources()');
      const resources = await fetchMCPResources();
      console.log('Store: Received MCP resources data:', resources);
      set({ resources, isLoading: false });
      console.log('Store: Successfully updated state with MCP resources data');
    } catch (error) {
      console.error('Error fetching MCP resources:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch MCP resources', 
        isLoading: false,
        resources: [] 
      });
    }
  },

  fetchPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Store: Calling fetchMCPPrompts()');
      const prompts = await fetchMCPPrompts();
      console.log('Store: Received MCP prompts data:', prompts);
      set({ prompts, isLoading: false });
      console.log('Store: Successfully updated state with MCP prompts data');
    } catch (error) {
      console.error('Error fetching MCP prompts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch MCP prompts', 
        isLoading: false,
        prompts: [] 
      });
    }
  },

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().fetchStatus();
      await get().fetchTools();
      await get().fetchResources();
      await get().fetchPrompts();
    } catch (error) {
      console.error('Error in fetchAll:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch MCP data', 
        isLoading: false 
      });
    }
  }
}));