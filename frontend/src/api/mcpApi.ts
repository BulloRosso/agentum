import axios from 'axios';

// Types for MCP status response
export interface MCPStatus {
  tools: number;
  resources: number;
  prompts: number;
  status: string;
}

// Types for MCP tools
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    required: string[];
    properties: Record<string, {
      type: string;
      description: string;
    }>;
  };
}

// Types for MCP resources
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

// Types for MCP prompts
export interface MCPPrompt {
  name: string;
  description: string;
  arguments: {
    name: string;
    description: string;
    required: boolean;
  }[];
}

// Fetch MCP server status
export const fetchMCPStatus = async (): Promise<MCPStatus> => {
  try {
    console.log('Fetching MCP status...');
    const response = await axios.get('/sse/status');
    console.log('MCP status response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP status:', error);
    throw error;
  }
};

// Fetch available tools
export const fetchMCPTools = async (): Promise<MCPTool[]> => {
  try {
    console.log('Fetching MCP tools...');
    const response = await axios.get('/sse/tools');
    console.log('MCP tools response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    throw error;
  }
};

// Fetch available resources
export const fetchMCPResources = async (): Promise<MCPResource[]> => {
  try {
    console.log('Fetching MCP resources...');
    const response = await axios.get('/sse/resources');
    console.log('MCP resources response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP resources:', error);
    throw error;
  }
};

// Fetch available prompts
export const fetchMCPPrompts = async (): Promise<MCPPrompt[]> => {
  try {
    console.log('Fetching MCP prompts...');
    const response = await axios.get('/sse/prompts');
    console.log('MCP prompts response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP prompts:', error);
    throw error;
  }
};